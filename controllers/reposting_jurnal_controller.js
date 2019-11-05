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
            resperrParam += 'TRANSAKSI ID TIDAK ADA\n';
            errParam++;
        }
        if (!params.type) {
            resperrParam += 'TYPE TRANSAKSI TIDAK ADA\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        if (params.type === 'tabungan') {
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT tabtrans_id,tabtrans.userid,tabung.no_rekening,tabtrans.kode_kantor,kode_integrasi,my_kode_trans,pokok,' +
                    ' kode_trans,tabtrans.keterangan FROM tabtrans INNER JOIN tabung ON tabung.no_rekening = tabtrans.no_rekening' +
                    ' WHERE tabtrans_id = ' + params.trans_id + ' AND kuitansi_id NOT IN ( SELECT kuitansi_id FROM transaksi_master WHERE' +
                    ' kuitansi_id IS NOT NULL AND TRANS_ID_SOURCE = ' + params.trans_id + ' ) UNION ALL' +
                    ' SELECT tabtrans_id,tabtrans.userid,tabung.no_rekening,tabtrans.kode_kantor,kode_integrasi,my_kode_trans,pokok,kode_trans,' +
                    ' tabtrans.keterangan FROM tabtrans INNER JOIN tabung ON tabung.no_rekening = tabtrans.no_rekening WHERE' +
                    ' tabtrans_id = ' + params.trans_id + ' AND kuitansi_id IN (SELECT kuitansi_id FROM transaksi_master WHERE' +
                    ' trans_id IN (SELECT x.MASTER_ID FROM(SELECT MASTER_ID,sum( debet ) debet,sum( kredit ) kredit' +
                    ' FROM transaksi_detail WHERE master_id IN ( SELECT trans_id FROM transaksi_master' +
                    ' WHERE KODE_JURNAL = "TAB" AND TRANS_ID_SOURCE = ' + params.trans_id + ' ) GROUP BY master_id ) x WHERE debet <> kredit ))';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        responseBody = utility.GiveResponse("00", "LOAD REPOSTING JURNAL SUKSES", rows);
                    } else {
                        responseBody = utility.GiveResponse("01", "LOAD REPOSTING JURNAL GAGAL! TRANSAKSI TIDAK DITEMUKAN");
                    }
                    global_function.InsertLogService(apicode.apiCodeInquiryRepostingJurnal, params, responseBody, params.kode_kantor, params.user_id);
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
            resperrParam += 'TRANSAKSI ID TIDAK ADA\n';
            errParam++;
        }
        if (params.user_id === '' || !params.user_id) {
            resperrParam += 'USER ID TRANSAKSI TIDAK ADA\n';
            errParam++;
        }

        if (params.tgl_trans === '' || !params.tgl_trans) {
            resperrParam += 'TANGGAL TRANSAKSI TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_trans === '' || !params.kode_trans) {
            resperrParam += 'TANGGAL TRANSAKSI TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_kantor === '' || !params.kode_kantor) {
            resperrParam += 'KODE KANTOR TRANSAKSI TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_integrasi === '' || !params.kode_integrasi) {
            resperrParam += 'PARAMETER KODE INTEGRASI TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_trans === '' || !params.kode_trans) {
            resperrParam += 'PARAMETER KODE TRANS TIDAK ADA\n';
            errParam++;
        }
        if (params.keterangan === '' || !params.keterangan) {
            resperrParam += 'KETERANGAN TRANSAKSI TIDAK ADA\n';
            errParam++;
        }
        if (params.kuitansi === '' || !params.kuitansi) {
            resperrParam += 'NOMOR KUITANSI KOSONG!\n';
            errParam++;
        }
        if (params.kuitansi_id === '' || !params.kuitansi_id) {
            resperrParam += 'NOMOR REFRENSI SYSTEM KOSONG!\n';
            errParam++;
        }
        if (params.my_kode_trans === '' || !params.my_kode_trans) {
            resperrParam += 'PARAMETER MY KODE TRANS TIDAK ADA\n';
            errParam++;
        }
        if (params.pokok === '' || !params.pokok) {
            resperrParam += 'PARAMETER POKOK TIDAK ADA\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        global_function.DeleteTrans('transaksi_master', 'trans_id_source', params.trans_id);
        let result = false;
        let kodePerkiraanSimpanan = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', params.kode_integrasi);
        let kodePerkKas = '';
        if (params.kode_trans === kodetrans.tabungan.kodeTransSetorTunai || params.kode_trans === kodetrans.tabungan.kodeTransTarikTunai) {
            kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', params.user_id);
        } else if (params.kode_trans === kodetrans.tabungan.kodeTransSetorCoa || params.kode_trans === kodetrans.tabungan.kodeTransTarikCoa) {
            kodePerkKas = params.kode_perk_ob;
        } else if (params.kode_trans === kodetrans.tabungan.kodeTransSetorABA || params.kode_trans === kodetrans.tabungan.kodeTransTarikABA) {
            let kodeIntegrasiABA = await global_function.GetValByKeyValString('kode_integrasi', 'aba', 'no_rekening', params.no_rekening_aba);
            kodePerkKas = await global_function.GetValByKeyValString('perk_pokok', 'aba_integrasi', 'kode_aba', kodeIntegrasiABA);
        }
        let transIdMaster = await global_function.GenerateTransID(params.user_id);
        let transMaster = await global_function.InsertTransaksiMaster(transIdMaster, 'TAB', params.kuitansi,
            params.tgl_trans, params.keterangan, 'TAB', params.trans_id, params.user_id,
            params.kode_kantor, params.kuitansi_id, '1');
        if (transMaster) {
            if (params.my_kode_trans === '100') {
                let transIdDetail = await global_function.GenerateTransID(params.user_id);
                result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkKas,
                    params.pokok, '0', params.kode_kantor, params.keterangan);
                if (result) {
                    transIdDetail = await global_function.GenerateTransID(params.user_id);
                    result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkiraanSimpanan,
                        '0', params.pokok, params.kode_kantor, params.keterangan);
                }
            } else {
                let transIdDetail = await global_function.GenerateTransID(params.user_id);
                result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkiraanSimpanan,
                    params.pokok, '0', params.kode_kantor, params.keterangan);
                if (result) {
                    transIdDetail = await global_function.GenerateTransID(params.user_id);
                    result = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkKas,
                        '0', params.pokok, params.kode_kantor, params.keterangan);
                }
            }
        }
        if (result) {
            responseBody = utility.GiveResponse("00", "REPOSTING TRANSAKSI SUKSES");
        } else {
            responseBody = utility.GiveResponse("01", "REPOSTING TRANSAKSI GAGAL");
        }
        global_function.InsertLogService(apicode.apiCodeRepostingJurnal, params, responseBody, params.kode_kantor, params.user_id);
        return res.send(responseBody);

    }
};
