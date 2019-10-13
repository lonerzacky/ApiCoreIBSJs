const pool = require('../config/pooling');
const utility = require('../helpers/utility');
const global_function = require('../helpers/global_function');
const saldo = require('../helpers/saldo');
const kodetrans = require('../constants/kodetrans');
const apicode = require('../constants/apicode');
const abatrans = require('../setter-getter/abatrans');
const crudaba = require('../crud/crudaba');

module.exports = {
    HandlerTransABA: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.no_rekening === '' || !params.no_rekening) {
            resperrParam += 'PARAMETER NO REKENING TIDAK ADA\n';
            errParam++;
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'aba', 'no_rekening', params.no_rekening);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "NO REKENING ABA TIDAK DITEMUKAN"));
        }
        if (params.tgl_trans === '' || !params.tgl_trans) {
            resperrParam += 'PARAMETER TGL TRANS TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_trans === '' || !params.kode_trans) {
            resperrParam += 'PARAMETER KODE TRANS TIDAK ADA\n';
            errParam++;
        }
        if (params.my_kode_trans === '' || !params.my_kode_trans) {
            resperrParam += 'PARAMETER MY KODE TRANS TIDAK ADA\n';
            errParam++;
        }
        if (params.kuitansi_id === '' || !params.kuitansi_id) {
            resperrParam += 'NOMOR REFRENSI SYSTEM KOSONG!\n';
            errParam++;
        }
        if (params.kode_integrasi === '' || !params.kode_integrasi) {
            resperrParam += 'PARAMETER KODE INTEGRASI TIDAK ADA\n';
            errParam++;
        }
        if (params.keterangan === '' || !params.keterangan) {
            resperrParam += 'PARAMETER KETERANGAN TIDAK ADA\n';
            errParam++;
        }
        if (params.user_id === '' || !params.user_id) {
            resperrParam += 'PARAMETER USER ID TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_kantor === '' || !params.kode_kantor) {
            resperrParam += 'PARAMETER KODE KANTOR TIDAK ADA\n';
            errParam++;
        }
        if (params.jam === '' || !params.jam) {
            resperrParam += 'PARAMETER JAM TIDAK ADA\n';
            errParam++;
        }
        if (params.ip_add === '' || !params.ip_add) {
            resperrParam += 'PARAMETER IP ADDRESS TIDAK ADA\n';
            errParam++;
        }
        if (params.nominal === '' || !params.nominal) {
            resperrParam += 'PARAMETER NOMINAL TIDAK ADA\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        let kodePerkPokok = await global_function.GetValByKeyValString('perk_pokok', 'aba_integrasi', 'kode_aba', params.kode_integrasi);
        if (kodePerkPokok === '') {
            responseBody = utility.GiveResponse("01", "LOAD KODE PERK POKOK ABA GAGAL, SILAHKAN SETTING INTEGRASI PERKIRAAN");
            global_function.InsertLogService(apicode.apiCodeTransABA, params, responseBody, params.kode_kantor, params.user_id);
            return res.send(responseBody);
        }
        if (params.kode_trans === kodetrans.aba.kodeTransSetorTunai || params.kode_trans === kodetrans.aba.kodeTransTarikTunai) {
            let kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', params.user_id);
            if (kodePerkKas === '') {
                return res.send(utility.GiveResponse("01", "KODE PERK KAS USER BELUM TERDEFINISI"));
            }
            if (params.kode_trans === kodetrans.aba.kodeTransTarikTunai) {
                let saldoKas = await global_function.GetAccSaldoPerk(kodePerkKas, params.kode_kantor, params.tgl_trans, params.user_id);
                if (saldoKas < parseFloat(params.nominal)) {
                    return res.send(utility.GiveResponse("01", "SALDO KAS TIDAK MENCUKUPI!"));
                }
            }
        }
        if (await global_function.IsKuitansiExist('kuitansi_id', 'abatrans', 'kuitansi_id', params.kuitansi_id, 'no_rekening', params.no_rekening)) {
            return res.send(utility.GiveResponse("01", "KUITANSI " + params.kuitansi_id + " DUPLIKAT"));
        }
        let transId = await global_function.GenerateTransID(params.user_id);
        if (transId === 0) {
            responseBody = utility.GiveResponse("01", "GENERATE TRANS ID GAGAL, SILAHKAN COBA LAGI");
            global_function.InsertLogService(apicode.apiCodeTransABA, params, responseBody, params.kode_kantor, params.user_id);
            return res.send(responseBody);
        }
        let tob = '';
        if (params.kode_trans === kodetrans.aba.kodeTransSetorTunai || params.kode_trans === kodetrans.aba.kodeTransTarikTunai) {
            tob = 'T';
        } else {
            tob = 'O';
        }
        let abaPokok = '';
        switch (params.kode_integrasi.substring(0, 1)) {
            case '1' :
                abaPokok = 'giro_pokok';
                break;
            case '2' :
                abaPokok = 'tab_pokok';
                break;
            case '3' :
                abaPokok = 'dep_pokok';
                break;
        }
        pool.getConnection(function (err, connection) {
            let sqlString = 'INSERT INTO abatrans(abatrans_id,tgl_trans,no_rekening,my_kode_trans,kuitansi,' +
                'tob,modul_id_source,' + abaPokok + ',keterangan,verifikasi,' +
                'userid,kode_trans,kode_kantor,jam,ip_add,kuitansi_id)' +
                'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            connection.query(sqlString, [
                transId, params.tgl_trans, params.no_rekening, params.my_kode_trans, params.kuitansi,
                tob, params.kode_integrasi, params.nominal, params.keterangan, '1', params.user_id,
                params.kode_trans, params.kode_kantor, params.jam, params.ip_add, params.kuitansi_id
            ], function (err) {
                if (err) {
                    console.error(`INSERT ABATRANS ERROR: ${err.message}`);
                    responseBody = utility.GiveResponse("01", "TRANSAKSI ABA GAGAL");
                } else {
                    let respData = {
                        'trans_id': transId
                    };
                    abatrans.abatrans_id = transId;
                    abatrans.kode_integrasi = params.kode_integrasi;
                    abatrans.nominal = params.nominal;
                    abatrans.kode_trans = params.kode_trans;
                    abatrans.userid = params.user_id;
                    abatrans.kuitansi = params.kuitansi;
                    abatrans.tgl_trans = params.tgl_trans;
                    abatrans.keterangan = params.keterangan;
                    abatrans.kode_kantor = params.kode_kantor;
                    abatrans.kuitansi_id = params.kuitansi_id;
                    let result = crudaba.AddTransABA(abatrans);
                    if (result) {
                        saldo.RepostingSaldoABA(params.no_rekening, params.tgl_trans);
                        responseBody = utility.GiveResponse("00", "TRANSAKSI ABA SUKSES", respData);
                    } else {
                        responseBody = utility.GiveResponse("01", "TRANSAKSI ABA GAGAL");
                        global_function.DeleteTrans('transaksi_master', 'trans_id_source', transId);
                        global_function.DeleteTrans('abatrans', 'abatrans_id', transId);
                    }
                }
                global_function.InsertLogService(apicode.apiCodeTransABA, params, responseBody, params.kode_kantor, params.user_id);
                return res.send(responseBody);
            });
        });
    }
};
