const utility = require("../helpers/utility");
const global_function = require('../helpers/global_function');
const accounting = require('../helpers/accounting');
const pool = require('../config/pooling');
const poolSys = require('../config/pooling_sys');
const apicode = require('../constants/apicode');
const jwt = require('jsonwebtoken');

module.exports = {
    HandlerGetKuitansi: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.client_id === '' || !params.client_id) {
            resperrParam += 'MISSING CLIENT ID PARAMETER\n';
            errParam++;
        }
        if (params.date_transaction === '' || !params.date_transaction) {
            resperrParam += 'MISSING DATE TRANSACTION PARAMETER\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        let kuitansi = "";
        let setting = await global_function.GetSysMySysIdValue('APP_TEMPLATE_NO_KUITANSI');
        pool.getConnection(function (err, connection) {
            let sqlString = 'SELECT GENERATE_KUITANSI(' + params.client_id + ',' + process.env.APIUSERID + ',' + params.date_transaction + ') kuitansi ';
            connection.query(sqlString, function (err, rows) {
                if (err) {
                    console.error(`GET FUNC KUITANSI GAGAL : ${err.message}`);
                    responseBody = utility.GiveResponse("01", "GET TRX REFF NO FAILED");
                    global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.client_id, process.env.APIUSERID);
                    return res.send(responseBody);
                } else {
                    kuitansi = rows[0].kuitansi;
                    sqlString = 'SELECT GENERATE_KUITANSI_CLIENT(' + params.client_id + ',' + params.date_transaction + ') no_kuitansi_client';
                    connection.query(sqlString, function (err, rows) {
                        if (err) {
                            console.error(`GET FUNC KUITANSI CLIENT GAGAL : ${err.message}`);
                            responseBody = utility.GiveResponse("01", "GET TRX REFF NO FAILED");
                            global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.client_id, process.env.APIUSERID);
                            return res.send(responseBody);
                        } else {
                            // noinspection JSUnresolvedVariable
                            let kuitansiClient = rows[0].no_kuitansi_client;
                            let respKuintasi = {
                                "trx_no": utility.KuitansiClient(setting, params.client_id, kuitansiClient),
                                "trx_ref_id": kuitansi
                            };
                            responseBody = utility.GiveResponse("00", "GET TRX REFF NO SUCCESS", respKuintasi);
                            global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.client_id, process.env.APIUSERID);
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
            return res.send(utility.GiveResponse("01", "MISSING USERNAME PARAMETER"));
        }
        if (!params.password) {
            return res.send(utility.GiveResponse("01", "MISSING PASSWORD PARAMETER"));
        }
        poolSys.getConnection(function (err, connection) {
            let sqlString = `SELECT user_id,user_name,nama_lengkap,unit_kerja,sys_jabatan.sysjabatan_kode,
            sysjabatan_nama,sys_user_code.user_code,sys_user_code.deskripsi FROM sys_daftar_user 
            INNER JOIN sys_jabatan ON sys_daftar_user.sysjabatan_kode = sys_jabatan.sysjabatan_kode 
            INNER JOIN sys_user_code ON sys_daftar_user.user_code = sys_user_code.user_code 
            WHERE USER_NAME=? AND user_web_password=?`;
            connection.query(sqlString, [params.username, utility.EncodeSHA1(params.password)], function (err, rows) {
                if (!err && rows.length > 0) {
                    let respLogin = [{
                        user_id: rows[0].user_id,
                        user_name: rows[0].user_name,
                        full_name: rows[0].nama_lengkap,
                        client_id: rows[0].unit_kerja,
                        role_code: rows[0].sysjabatan_kode,
                        role_description: rows[0].sysjabatan_nama,
                        user_code: rows[0].user_code,
                        user_code_description: rows[0].deskripsi
                    }];
                    return res.send(utility.GiveResponse("00", "SUCCESSFULLY LOGIN", respLogin));
                } else {
                    return res.send(utility.GiveResponse("01", "LOGIN FAILED! INCORRECT USERNAME OR PASSWORD"));
                }
            });
        });
    },
    HandlerLoginMobileApp: async function (req, res) {
        let params = req.body;
        if (!params.username) {
            return res.send(utility.GiveResponse("01", "MISSING USERNAME PARAMETER"));
        }
        if (!params.password) {
            return res.send(utility.GiveResponse("01", "MISSING PASSWORD PARAMETER"));
        }
        pool.getConnection(function (err, connection) {
            let sqlString = `SELECT nasabah_id,nama_nasabah,nama_ibu_kandung,alamat,tempatlahir,tgllahir,
            no_id,tgl_register,kode_kantor,username from nasabah WHERE username=? AND password=?`;
            connection.query(sqlString, [params.username, utility.EncodeSHA1(params.password)], function (err, rows) {
                if (!err && rows.length > 0) {
                    let token = jwt.sign({
                        data: utility.EncodeSHA1(params.password)
                    }, process.env.JWT_SECRET, {
                        algorithm: 'HS256'
                    });
                    let respLogin = [{
                        customer_id: rows[0].nasabah_id,
                        customer_name: rows[0].nama_nasabah,
                        mothers_name: rows[0].nama_ibu_kandung,
                        address: rows[0].alamat,
                        date_of_birth: rows[0].tgllahir,
                        id_number: rows[0].no_id,
                        registrasion_date: rows[0].tgl_register,
                        client_id: rows[0].kode_kantor,
                        username: rows[0].username,
                        token: token
                    }];
                    return res.send(utility.GiveResponse("00", "SUCCESSFULLY LOGIN", respLogin));
                } else {
                    return res.send(utility.GiveResponse("01", "LOGIN FAILED! INCORRECT USERNAME OR PASSWORD"));
                }
            });
        });
    },
    HandlerCekStatus: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        if (!params.trans_id) {
            return res.send(utility.GiveResponse("01", "MISSING TRANS ID PARAMETER"));
        }
        if (!params.client_id) {
            return res.send(utility.GiveResponse("01", "MISSING CLIENT_ID PARAMETER"));
        }
        if (!params.trx_ref_id) {
            return res.send(utility.GiveResponse("01", "MISSING TRX REF ID PARAMETER"));
        }
        if (!params.type) {
            return res.send(utility.GiveResponse("01", "MISSING TYPE PARAMETER"));
        }
        if (params.type === 'tabungan') {
            let countNoBalance = await accounting.GetTabJurnalNoBalance(params.trans_id);
            pool.getConnection(function (err, connection) {
                let sqlString = `SELECT tabtrans_id,kode_kantor,TGL_TRANS,NO_REKENING,POKOK,KETERANGAN 
                FROM tabtrans WHERE tabtrans_id=? AND kuitansi_id=? AND kode_kantor=?`;
                connection.query(sqlString, [params.trans_id, params.trx_ref_id, params.client_id], function (err, rows) {
                    if (!err && rows.length > 0) {
                        let respTrans = [{
                            trans_id: rows[0].tabtrans_id,
                            client_id: rows[0].kode_kantor,
                            date_transaction: rows[0].TGL_TRANS,
                            account_number: rows[0].NO_REKENING,
                            trx_amount: rows[0].POKOK,
                            trx_description: rows[0].KETERANGAN
                        }];
                        if (countNoBalance === 1) {
                            responseBody = utility.GiveResponse("01", "TRANSACTIONS NEED TO REPOSTING (JOURNAL NO BALANCE)", respTrans);
                        } else {
                            responseBody = utility.GiveResponse("00", "TRANSACTION SUCCESS", respTrans);
                        }
                    } else {
                        responseBody = utility.GiveResponse("01", "TRANSACTION NOT FOUND");
                    }
                    global_function.InsertLogService(apicode.apiCodeCekStatusTransaksi, params, responseBody, params.client_id, process.env.APIUSERID);
                    return res.send(responseBody);
                });
            });
        }
    }
};
