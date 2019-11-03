const pool = require('../config/pooling');
module.exports = {
    GetTabJurnalNoBalance: function (tabtrans_id) {
        return new Promise(resolve => {
            let returnId = 0;
            pool.getConnection(function (err, connection) {
                let sqlString = `SELECT tabtrans_id FROM tabtrans WHERE tabtrans_id = ? 
                AND kuitansi_id NOT IN ( SELECT kuitansi_id FROM transaksi_master WHERE 
                kuitansi_id IS NOT NULL AND TRANS_ID_SOURCE = '11877801' ) UNION ALL 
                SELECT tabtrans_id FROM tabtrans WHERE tabtrans_id = ? AND kuitansi_id IN (
                SELECT kuitansi_id FROM transaksi_master WHERE trans_id IN (
                SELECT x.MASTER_ID FROM ( SELECT MASTER_ID, sum( debet ) debet,
                sum( kredit ) kredit FROM transaksi_detail WHERE 
                master_id IN ( SELECT trans_id FROM transaksi_master WHERE KODE_JURNAL = 'TAB' 
                AND TRANS_ID_SOURCE = '11877801' ) GROUP BY master_id ) x WHERE
                debet <> kredit))`;
                connection.query(sqlString,
                    [tabtrans_id], function (err, rows) {
                        if (!err && rows.length > 0) {
                            returnId = 1;
                            resolve(returnId);
                        } else {
                            returnId = 0;
                            console.error(`GAGAL GET JURNAL TAB NO BALANCE : ${err.message}`);
                        }
                    });
                connection.release();
            });
        });
    },
};
