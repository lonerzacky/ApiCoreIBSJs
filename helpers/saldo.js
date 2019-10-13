const pool = require('../config/pooling');
module.exports = {
    GetSaldoAkhirTabungan: function GetSaldoAkhirTabungan(no_rekening, tgl_trans) {
        return new Promise(resolve => {
            let saldoAkhir = 0;
            pool.getConnection(function (err, connection) {
                let sqlString = `SELECT(
                SUM( IF ( floor( tabtrans.my_kode_trans / 100 ) = 1, tabtrans.pokok, 0 ) )- SUM( IF ( floor( tabtrans.my_kode_trans / 100 ) = 2, tabtrans.pokok, 0 ) )) AS saldo_akhir 
                FROM tabtrans WHERE no_rekening = ? AND tgl_trans<=?`;
                connection.query(sqlString,
                    [no_rekening, tgl_trans], function (err, rows) {
                        if (!err && rows.length > 0) {
                            saldoAkhir = rows[0].saldo_akhir;
                            resolve(saldoAkhir);
                        } else {
                            saldoAkhir = 0;
                            console.error(`GAGAL GET SALDO AKHIR : ${err.message}`);
                        }
                    });
                connection.release();
            });
        });
    },
    GetSaldoAkhirABA: async function (no_rekening, tgl_trans) {
        return new Promise(resolve => {
            let saldoAkhirABA = 0;
            pool.getConnection(function (err, connection) {
                let sqlString = `SELECT(
                SUM( IF ( floor( my_kode_trans / 100 ) = 1, COALESCE(tab_pokok,0)+COALESCE(dep_pokok,0)+COALESCE(giro_pokok,0) , 0 ) )- 
                SUM( IF ( floor( my_kode_trans / 100 ) = 2, COALESCE(tab_pokok,0)+COALESCE(dep_pokok,0)+COALESCE(giro_pokok,0), 0 ) )) AS saldo_akhir 
                FROM abatrans WHERE no_rekening = ? AND tgl_trans<=?`;
                connection.query(sqlString,
                    [no_rekening, tgl_trans], function (err, rows) {
                        if (!err && rows.length > 0) {
                            saldoAkhirABA = rows[0].saldo_akhir;
                            resolve(saldoAkhirABA);
                        } else {
                            saldoAkhirABA = 0;
                            console.error(`GAGAL GET SALDO AKHIR : ${err.message}`);
                        }
                    });
                connection.release();
            });
        });
    },
    RepostingSaldoTabungan: async function (no_rekening, tgl_trans) {
        let saldoAkhir = await module.exports.GetSaldoAkhirTabungan(no_rekening, tgl_trans);
        pool.getConnection(function (err, connection) {
            let sqlString = `UPDATE tabung SET saldo_akhir=? WHERE no_rekening=?`;
            connection.query(sqlString, [saldoAkhir, no_rekening], function (err) {
                if (err) {
                    saldoAkhir = 0;
                    console.error(`UPDATE SALDO AKHIR GAGAL : ${err.message}`);
                }
            });
            connection.release();
        });
    },
    RepostingSaldoABA: async function (no_rekening, tgl_trans) {
        let saldoAkhirABA = await module.exports.GetSaldoAkhirABA(no_rekening, tgl_trans);
        pool.getConnection(function (err, connection) {
            let sqlString = `UPDATE aba SET saldo_akhir_pokok=? WHERE no_rekening=?`;
            connection.query(sqlString, [saldoAkhirABA, no_rekening], function (err) {
                if (err) {
                    saldoAkhirABA = 0;
                    console.error(`UPDATE SALDO AKHIR ABA GAGAL : ${err.message}`);
                }
            });
            connection.release();
        });
    }
};
