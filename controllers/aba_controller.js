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
        if (params.account_number === '' || !params.account_number) {
            resperrParam += 'MISSING ACCOUNT NUMBER PARAMETER\n';
            errParam++;
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'aba', 'no_rekening', params.account_number);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "ACCOUNT NUMBER ABA IS NOT FOUND"));
        }
        if (params.date_transaction === '' || !params.date_transaction) {
            resperrParam += 'MISSING DATE TRANSACTION PARAMETER\n';
            errParam++;
        }
        if (params.trans_code === '' || !params.trans_code) {
            resperrParam += 'MISSING TRANS CODE PARAMETER\n';
            errParam++;
        }
        if (params.my_trans_code === '' || !params.my_trans_code) {
            resperrParam += 'MISSING MY TRANS CODE PARAMETE\n';
            errParam++;
        }
        if (params.trx_ref_id === '' || !params.trx_ref_id) {
            resperrParam += 'TRX NUMBER IS EMPTY!\n';
            errParam++;
        }
        if (params.integration_code === '' || !params.integration_code) {
            resperrParam += 'MISSING INTEGRATION CODE PARAMETER\n';
            errParam++;
        }
        if (params.trx_description === '' || !params.trx_description) {
            resperrParam += 'MISSING TRX DESCRIPTION PARAMETER\n';
            errParam++;
        }
        if (params.client_id === '' || !params.client_id) {
            resperrParam += 'MISSING CLIENT ID PARAMETER\n';
            errParam++;
        }
        if (params.hour_transaction === '' || !params.hour_transaction) {
            resperrParam += 'MISSING HOUR TRANSACTION PARAMETER\n';
            errParam++;
        }
        if (params.ip_add === '' || !params.ip_add) {
            resperrParam += 'MISSING IP ADDRESS PARAMETER\n';
            errParam++;
        }
        if (params.trx_amount === '' || !params.trx_amount) {
            resperrParam += 'MISING TRX AMOUNT PARAMETER\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        let kodePerkPokok = await global_function.GetValByKeyValString('perk_pokok', 'aba_integrasi', 'kode_aba', params.integration_code);
        if (kodePerkPokok === '') {
            responseBody = utility.GiveResponse("01", "LOAD KODE PERK POKOK ABA GAGAL, SILAHKAN SETTING INTEGRASI PERKIRAAN");
            global_function.InsertLogService(apicode.apiCodeTransABA, params, responseBody, params.client_id, process.env.APIUSERID);
            return res.send(responseBody);
        }
        if (params.trans_code === kodetrans.aba.kodeTransSetorTunai || params.trans_code === kodetrans.aba.kodeTransTarikTunai) {
            let kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', process.env.APIUSERID);
            if (kodePerkKas === '') {
                return res.send(utility.GiveResponse("01", "KODE PERK KAS USER BELUM TERDEFINISI"));
            }
            if (params.trans_code === kodetrans.aba.kodeTransTarikTunai) {
                let saldoKas = await global_function.GetAccSaldoPerk(kodePerkKas, params.client_id, params.date_transaction, process.env.APIUSERID);
                if (saldoKas < parseFloat(params.trx_amount)) {
                    return res.send(utility.GiveResponse("01", "SALDO KAS TIDAK MENCUKUPI!"));
                }
            }
        }
        if (params.trans_code === kodetrans.aba.kodeTransSetorCoa || params.trans_code === kodetrans.aba.kodeTransTarikCoa) {
            if (params.kode_perk_ob === '') {
                return res.send(utility.GiveResponse("00", "KODE PERK OB HARUS TERISI"));
            } else {
                let existKodePerkOb = await global_function.GetValByKeyValString('kode_perk', 'perkiraan', 'kode_perk', params.kode_perk_ob);
                if (existKodePerkOb === '') {
                    return res.send(utility.GiveResponse("01", "KODE PERK OB TIDAK DITEMUKAN"));
                }
            }
            let flagMinus = await global_function.GetValByKeyValString('flag_minus', 'perkiraan', 'kode_perk', params.kode_perk_ob);
            let saldoPerk = await global_function.GetAccSaldoPerkDetail(params.kode_perk_ob, params.client_id, params.date_transaction);
            if (params.trans_code === kodetrans.aba.kodeTransSetorCoa) {
                if (params.kode_perk_ob.substring(0, 1) === '2' || params.kode_perk_ob.substring(0, 1) === '4') {
                    if (flagMinus !== '1') {
                        if (saldoPerk < parseFloat(params.pokok)) {
                            return res.send(utility.GiveResponse("01", "SALDO PERKIRAAN [" + params.kode_perk_ob + "] TIDAK MENCUKUPI!"));
                        }
                    }
                }
            }
            if (params.trans_code === kodetrans.aba.kodeTransTarikCoa) {
                if (params.kode_perk_ob.substring(0, 1) === '1' || params.kode_perk_ob.substring(0, 1) === '5') {
                    if (flagMinus !== '1') {
                        if (saldoPerk < parseFloat(params.pokok)) {
                            return res.send(utility.GiveResponse("01", "SALDO PERKIRAAN [" + params.kode_perk_ob + "] TIDAK MENCUKUPI!"));
                        }
                    }
                }
            }
        }
        if (await global_function.IsKuitansiExist('kuitansi_id', 'abatrans', 'kuitansi_id', params.trx_ref_id, 'no_rekening', params.account_number)) {
            return res.send(utility.GiveResponse("01", "KUITANSI " + params.trx_ref_id + " DUPLIKAT"));
        }
        let transId = await global_function.GenerateTransID(process.env.APIUSERID);
        if (transId === 0) {
            responseBody = utility.GiveResponse("01", "GENERATE TRANS ID GAGAL, SILAHKAN COBA LAGI");
            global_function.InsertLogService(apicode.apiCodeTransABA, params, responseBody, params.client_id, process.env.APIUSERID);
            return res.send(responseBody);
        }
        let tob = '';
        if (params.trans_code === kodetrans.aba.kodeTransSetorTunai || params.trans_code === kodetrans.aba.kodeTransTarikTunai) {
            tob = 'T';
        } else {
            tob = 'O';
        }
        let abaPokok = '';
        switch (params.integration_code.substring(0, 1)) {
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
                'userid,kode_trans,kode_kantor,jam,ip_add,kuitansi_id,kode_perk_ob)' +
                'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
            connection.query(sqlString, [
                transId, params.date_transaction, params.account_number, params.my_trans_code, params.kuitansi,
                tob, params.integration_code, params.trx_amount, params.trx_description, '1', process.env.APIUSERID,
                params.trans_code, params.client_id, params.hour_transaction, params.ip_add, params.trx_ref_id,
                params.kode_perk_ob
            ], function (err) {
                if (err) {
                    console.error(`INSERT ABATRANS ERROR: ${err.message}`);
                    responseBody = utility.GiveResponse("01", "TRANSAKSI ABA GAGAL");
                } else {
                    let respData = {
                        'trans_id': transId
                    };
                    abatrans.abatrans_id = transId;
                    abatrans.kode_integrasi = params.integration_code;
                    abatrans.nominal = params.trx_amount;
                    abatrans.kode_trans = params.trans_code;
                    abatrans.userid = process.env.APIUSERID;
                    abatrans.kuitansi = params.kuitansi;
                    abatrans.tgl_trans = params.date_transaction;
                    abatrans.keterangan = params.trx_description;
                    abatrans.kode_kantor = params.client_id;
                    abatrans.kuitansi_id = params.trx_ref_id;
                    abatrans.my_kode_trans = params.my_trans_code;
                    abatrans.kode_perk_ob = params.kode_perk_ob;
                    let result = crudaba.AddTransABA(abatrans);
                    if (result) {
                        saldo.RepostingSaldoABA(params.account_number, params.date_transaction);
                        responseBody = utility.GiveResponse("00", "TRANSAKSI ABA SUKSES", respData);
                    } else {
                        responseBody = utility.GiveResponse("01", "TRANSAKSI ABA GAGAL");
                        global_function.DeleteTrans('transaksi_master', 'trans_id_source', transId);
                        global_function.DeleteTrans('abatrans', 'abatrans_id', transId);
                    }
                }
                global_function.InsertLogService(apicode.apiCodeTransABA, params, responseBody, params.client_id, process.env.APIUSERID);
                return res.send(responseBody);
            });
        });
    }
};
