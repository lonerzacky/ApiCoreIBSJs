const utility = require('../helpers/utility');
const pool = require('../config/pooling');
const global_function = require('../helpers/global_function');
const apicode = require('../constants/apicode');
const kodetrans = require('../constants/kodetrans');

module.exports = {
    HandlerInquiryRepostingJurnal: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.trans_id === '' || !params.trans_id) {
            resperrParam += 'NO TRX ID FOUND\n';
            errParam++;
        }
        if (!params.type) {
            resperrParam += 'MISSING TRX TYPE PARAMETER\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        if (params.type === 'tabungan') {
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT tabtrans_id,tabtrans.userid,tabtrans.kuitansi,tabtrans.kuitansi_id,no_rekening_aba,no_rekening_vs,kode_perk_ob,' +
                    ' tabung.no_rekening,tabtrans.kode_kantor,kode_integrasi,my_kode_trans,pokok,' +
                    ' kode_trans,tabtrans.keterangan FROM tabtrans INNER JOIN tabung ON tabung.no_rekening = tabtrans.no_rekening' +
                    ' WHERE tabtrans_id = ' + params.trans_id + ' AND kuitansi_id NOT IN ( SELECT kuitansi_id FROM transaksi_master WHERE' +
                    ' kuitansi_id IS NOT NULL AND TRANS_ID_SOURCE = ' + params.trans_id + ' ) UNION ALL' +
                    ' SELECT tabtrans_id,tabtrans.userid,tabtrans.kuitansi,tabtrans.kuitansi_id,no_rekening_aba,no_rekening_vs,kode_perk_ob,' +
                    ' tabung.no_rekening,tabtrans.kode_kantor,kode_integrasi,my_kode_trans,pokok,kode_trans,' +
                    ' tabtrans.keterangan FROM tabtrans INNER JOIN tabung ON tabung.no_rekening = tabtrans.no_rekening WHERE' +
                    ' tabtrans_id = ' + params.trans_id + ' AND kuitansi_id IN (SELECT kuitansi_id FROM transaksi_master WHERE' +
                    ' trans_id IN (SELECT x.MASTER_ID FROM(SELECT MASTER_ID,sum( debet ) debet,sum( kredit ) kredit' +
                    ' FROM transaksi_detail WHERE master_id IN ( SELECT trans_id FROM transaksi_master' +
                    ' WHERE KODE_JURNAL = "TAB" AND TRANS_ID_SOURCE = ' + params.trans_id + ' ) GROUP BY master_id ) x WHERE debet <> kredit ))';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        let infoTrans = [{
                            trans_id: rows[0].tabtrans_id,
                            userid: rows[0].userid,
                            trx_number: rows[0].kuitansi,
                            trx_ref_id: rows[0].kuitansi_id,
                            account_number_aba: rows[0].no_rekening_aba,
                            account_number_vs: rows[0].no_rekening_vs,
                            ob_coa_code: rows[0].kode_perk_ob,
                            account_number: rows[0].no_rekening,
                            client_id: rows[0].kode_kantor,
                            integration_code: rows[0].kode_integrasi,
                            my_trans_code: rows[0].my_kode_trans,
                            trx_amount: rows[0].pokok,
                            trans_code: rows[0].kode_trans,
                            trx_description: rows[0].keterangan,
                        }];
                        responseBody = utility.GiveResponse("00", "SUCCESSFULLY LOAD REPOSTING JOURNAL", infoTrans);
                    } else {
                        responseBody = utility.GiveResponse("01", "LOAD REPOSTING JOURNAL FAILED! TRANSACTIONS IS NOT FOUND");
                    }
                    global_function.InsertLogService(apicode.apiCodeInquiryRepostingJurnal, params, responseBody, params.kode_kantor, process.env.APIUSERID);
                    return res.send(responseBody);
                });
            });
        }
    },
    HandlerRepostingJurnal: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.trans_id === '' || !params.trans_id) {
            resperrParam += 'MISSING TRANS ID PARAMETER\n';
            errParam++;
        }

        if (params.date_transaction === '' || !params.date_transaction) {
            resperrParam += 'MISSING DATE TRANSACTION PARAMETER\n';
            errParam++;
        }
        if (params.trans_code === '' || !params.trans_code) {
            resperrParam += 'MISSING TRANSACTION CODE PARAMETER\n';
            errParam++;
        }
        if (params.client_id === '' || !params.client_id) {
            resperrParam += 'MISSING CLIENT ID PARAMETER\n';
            errParam++;
        }
        if (params.integration_code === '' || !params.integration_code) {
            resperrParam += 'MISSING INTEGRATION CODE PARAMETER\n';
            errParam++;
        }
        if (params.trx_description === '' || !params.trx_description) {
            resperrParam += 'MISSING TRANSACTION DESCRIPTION PARAMETER\n';
            errParam++;
        }
        if (params.trx_number === '' || !params.trx_number) {
            resperrParam += 'TRX NUMBER IS EMPTY!\n';
            errParam++;
        }
        if (params.trx_number_id === '' || !params.trx_number_id) {
            resperrParam += 'TRX REF ID IS EMPTY!\n';
            errParam++;
        }
        if (params.my_trans_code === '' || !params.my_trans_code) {
            resperrParam += 'MISSING MY TRANS CODE PARAMETER\n';
            errParam++;
        }
        if (params.trans_code === kodetrans.tabungan.kodeTransSetorCoa || params.trans_code === kodetrans.tabungan.kodeTransTarikCoa) {
            if (params.ob_coa_code === '' || !params.ob_coa_code) {
                resperrParam += 'MISSING OB COA CODE PARAMETER\n';
                errParam++;
            }
        }
        if (params.trans_code === kodetrans.tabungan.kodeTransTransfer) {
            if (params.account_number_vs === '' || !params.account_number_vs) {
                resperrParam += 'ACCOUNT NUMBER VS IS NOT FOUND\n';
                errParam++;
            }
        }
        if (params.trans_code === kodetrans.tabungan.kodeTransSetorABA || params.trans_code === kodetrans.tabungan.kodeTransTarikABA) {
            if (params.account_number_aba === '' || !params.account_number_aba) {
                resperrParam += 'ACCOUNT NUMBER ABA IS NOT FOUND\n';
                errParam++;
            }
        }
        if (params.trx_amount === '' || !params.trx_amount) {
            resperrParam += 'MISSING TRX AMOUNT PARAMETER\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        global_function.DeleteTrans('transaksi_master', 'trans_id_source', params.trans_id);
        let result = false;
        let kodePerkiraanSimpanan = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', params.integration_code);
        let kodePerkKas = '';
        if (params.trans_code === kodetrans.tabungan.kodeTransSetorTunai || params.trans_code === kodetrans.tabungan.kodeTransTarikTunai) {
            kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', process.env.APIUSERID);
        } else if (params.trans_code === kodetrans.tabungan.kodeTransTransfer) {
            let kodeIntegrasiVs = await global_function.GetValByKeyValString('kode_integrasi', 'tabung', 'no_rekening', params.account_number_vs);
            kodePerkKas = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', kodeIntegrasiVs);
        } else if (params.trans_code === kodetrans.tabungan.kodeTransSetorCoa || params.trans_code === kodetrans.tabungan.kodeTransTarikCoa) {
            kodePerkKas = params.ob_coa_code;
        } else if (params.trans_code === kodetrans.tabungan.kodeTransSetorABA || params.trans_code === kodetrans.tabungan.kodeTransTarikABA) {
            let kodeIntegrasiABA = await global_function.GetValByKeyValString('kode_integrasi', 'aba', 'no_rekening', params.account_number_aba);
            kodePerkKas = await global_function.GetValByKeyValString('perk_pokok', 'aba_integrasi', 'kode_aba', kodeIntegrasiABA);
        }
        let transIdMaster = await global_function.GenerateTransID(process.env.APIUSERID);
        let transMaster = await global_function.InsertTransaksiMaster(transIdMaster, 'TAB', params.trx_number,
            params.date_transaction, params.trx_description, 'TAB', params.trans_id, process.env.APIUSERID,
            params.client_id, params.trx_number_id, '1');
        if (transMaster) {
            if (params.my_trans_code === '100') {
                let transIdDetail = await global_function.GenerateTransID(process.env.APIUSERID);
                result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkKas,
                    params.trx_amount, '0', params.client_id, params.trx_description);
                if (result) {
                    transIdDetail = await global_function.GenerateTransID(process.env.APIUSERID);
                    result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkiraanSimpanan,
                        '0', params.trx_amount, params.client_id, params.trx_description);
                }
            } else {
                let transIdDetail = await global_function.GenerateTransID(process.env.APIUSERID);
                result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkiraanSimpanan,
                    params.trx_amount, '0', params.client_id, params.trx_description);
                if (result) {
                    transIdDetail = await global_function.GenerateTransID(process.env.APIUSERID);
                    result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkKas,
                        '0', params.trx_amount, params.client_id, params.trx_description);
                }
            }
        }
        if (result) {
            let respData = {
                'trans_id': params.trans_id
            };
            responseBody = utility.GiveResponse("00", "REPOSTING TRANSACTION SUKSES", respData);
        } else {
            responseBody = utility.GiveResponse("01", "REPOSTING TRANSACTION FAILED");
        }
        global_function.InsertLogService(apicode.apiCodeRepostingJurnal, params, responseBody, params.client_id, process.env.APIUSERID);
        return res.send(responseBody);

    }
};
