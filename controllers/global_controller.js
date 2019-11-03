const utility = require("../helpers/utility");
const global_function = require('../helpers/global_function');
const accounting = require('../helpers/accounting');
const pool = require('../config/pooling');
const poolSys = require('../config/pooling_sys');
const apicode = require('../constants/apicode');

module.exports = {
    HandlerGetKuitansi: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.kode_kantor === '' || !params.kode_kantor) {
            resperrParam += 'PARAMETER KODE KANTOR TIDAK ADA\n';
            errParam++;
        }
        if (params.user_id === '' || !params.user_id) {
            resperrParam += 'PARAMETER USER ID TIDAK ADA\n';
            errParam++;
        }
        if (params.tgl_trans === '' || !params.tgl_trans) {
            resperrParam += 'PARAMETER TGL TRANS TIDAK ADA\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        let kuitansi = "";
        let setting = await global_function.GetSysMySysIdValue('APP_TEMPLATE_NO_KUITANSI');
        pool.getConnection(function (err, connection) {
            let sqlString = 'SELECT GENERATE_KUITANSI(' + params.kode_kantor + ',' + params.user_id + ',' + params.tgl_trans + ') kuitansi ';
            connection.query(sqlString, function (err, rows) {
                if (err) {
                    console.error(`GET FUNC KUITANSI GAGAL : ${err.message}`);
                    responseBody = utility.GiveResponse("01", "GET KUITANSI GAGAL");
                    global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.kode_kantor, params.user_id);
                    return res.send(responseBody);
                } else {
                    kuitansi = rows[0].kuitansi;
                    sqlString = 'SELECT GENERATE_KUITANSI_CLIENT(' + params.kode_kantor + ',' + params.tgl_trans + ') no_kuitansi_client';
                    connection.query(sqlString, function (err, rows) {
                        if (err) {
                            console.error(`GET FUNC KUITANSI CLIENT GAGAL : ${err.message}`);
                            responseBody = utility.GiveResponse("01", "GET KUITANSI CLIENT GAGAL");
                            global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.kode_kantor, params.user_id);
                            return res.send(responseBody);
                        } else {
                            // noinspection JSUnresolvedVariable
                            let kuitansiClient = rows[0].no_kuitansi_client;
                            let respKuintasi = {
                                "no_kuitansi_client": utility.KuitansiClient(setting, params.kode_kantor, kuitansiClient),
                                "no_kuitansi": kuitansi
                            };
                            responseBody = utility.GiveResponse("00", "GET KUITANSI SUKSES", respKuintasi);
                            global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.kode_kantor, params.user_id);
                            return res.send(responseBody);
                        }
                    });
                }
            });
            connection.release();
        });
    },
    HandlerLoginApp: async function (req, res) {
        let params = req.body;
        if (!params.username) {
            return res.send(utility.GiveResponse("01", "PARAMETER USERNAME KOSONG"));
        }
        if (!params.password) {
            return res.send(utility.GiveResponse("01", "PARAMETER PASSWORD KOSONG"));
        }
        poolSys.getConnection(function (err, connection) {
            let sqlString = `SELECT user_id,user_name,nama_lengkap,unit_kerja,sys_jabatan.sysjabatan_kode,
            sysjabatan_nama,sys_user_code.user_code,sys_user_code.deskripsi FROM sys_daftar_user 
            INNER JOIN sys_jabatan ON sys_daftar_user.sysjabatan_kode = sys_jabatan.sysjabatan_kode 
            INNER JOIN sys_user_code ON sys_daftar_user.user_code = sys_user_code.user_code 
            WHERE USER_NAME=? AND user_web_password=?`;
            connection.query(sqlString, [params.username, utility.EncodeSHA1(params.password)], function (err, rows) {
                if (!err && rows.length > 0) {
                    return res.send(utility.GiveResponse("00", "LOGIN SUKSES", rows));
                } else {
                    return res.send(utility.GiveResponse("01", "LOGIN GAGAL! USERNAME ATAU PASSWORD SALAH"));
                }
            });
        });
    },
    HandlerCekStatus: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        if (!params.trans_id) {
            return res.send(utility.GiveResponse("01", "PARAMETER TRANS ID KOSONG"));
        }
        if (!params.kode_kantor) {
            return res.send(utility.GiveResponse("01", "PARAMETER KODE KANTOR KOSONG"));
        }
        if (!params.user_id) {
            return res.send(utility.GiveResponse("01", "PARAMETER USER ID KOSONG"));
        }
        if (!params.kuitansi_id) {
            return res.send(utility.GiveResponse("01", "PARAMETER KUITANSI ID KOSONG"));
        }
        if (!params.type) {
            return res.send(utility.GiveResponse("01", "PARAMETER TYPE KOSONG"));
        }
        if (params.type === 'tabungan') {
            let countNoBalance = await accounting.GetTabJurnalNoBalance(params.trans_id);
            pool.getConnection(function (err, connection) {
                let sqlString = `SELECT tabtrans_id,kode_kantor,TGL_TRANS,NO_REKENING,POKOK,KETERANGAN 
                FROM tabtrans WHERE tabtrans_id=? AND kuitansi_id=? AND kode_kantor=?`;
                connection.query(sqlString, [params.trans_id, params.kuitansi_id, params.kode_kantor], function (err, rows) {
                    if (!err && rows.length > 0) {
                        console.log(countNoBalance);
                        if (countNoBalance === 1) {
                            responseBody = utility.GiveResponse("01", "TRANSAKSI PERLU REPOSTING (JURNAL NO BALANCE)", rows);
                        } else {
                            responseBody = utility.GiveResponse("00", "TRANSAKSI SUKSES", rows);
                        }
                    } else {
                        responseBody = utility.GiveResponse("01", "TRANSAKSI TIDAK DITEMUKAN");
                    }
                    global_function.InsertLogService(apicode.apiCodeCekStatusTransaksi, params, responseBody, params.kode_kantor, params.user_id);
                    return res.send(responseBody);
                });
            });
        }
    }
};
