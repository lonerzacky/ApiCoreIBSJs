const utility = require('../helpers/utility');
const pool = require('../config/pooling');
const global_function = require('../helpers/global_function');
const apicode = require('../constants/apicode');

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
                let sqlString = 'SELECT tabtrans_id,tabung.no_rekening,tabtrans.kode_kantor,kode_integrasi,my_kode_trans,pokok,' +
                    ' kode_trans,tabtrans.keterangan FROM tabtrans INNER JOIN tabung ON tabung.no_rekening = tabtrans.no_rekening' +
                    ' WHERE tabtrans_id = ' + params.trans_id + ' AND kuitansi_id NOT IN ( SELECT kuitansi_id FROM transaksi_master WHERE' +
                    ' kuitansi_id IS NOT NULL AND TRANS_ID_SOURCE = ' + params.trans_id + ' ) UNION ALL' +
                    ' SELECT tabtrans_id,tabung.no_rekening,tabtrans.kode_kantor,kode_integrasi,my_kode_trans,pokok,kode_trans,' +
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
    }
};
