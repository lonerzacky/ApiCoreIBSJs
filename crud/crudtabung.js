const global_function = require('../helpers/global_function');
const pool = require('../config/pooling');
const kodetrans = require('../constants/kodetrans');

module.exports = {
    /**
     * @return {boolean}
     */
    AddTransTarikTabungan: async function (tabtrans) {
        let res = false;
        let transIdVs = 0;
        let kodeIntegrasiABA = await global_function.GetValByKeyValString('kode_integrasi', 'aba', 'no_rekening', tabtrans.no_rekening_aba);
        if (tabtrans.no_rekening_vs !== '' && tabtrans.kode_trans === kodetrans.tabungan.kodeTransTransfer) {
            transIdVs = await global_function.GenerateTransID(tabtrans.user_id);
            if (transIdVs > 0 && tabtrans.pokok > '0') {
                pool.getConnection(function (err, connection) {
                    let sqlString = `INSERT INTO tabtrans(tabtrans_id,no_rekening,kode_kantor,kuitansi,tgl_trans,
                        jam,pokok,userid,ip_add,kode_trans,my_kode_trans,keterangan,modul_id_source,trans_id_source,
                        tob,kuitansi_id,sandi_trans,verifikasi,transfer)
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                    connection.query(sqlString,
                        [transIdVs, tabtrans.no_rekening_vs, tabtrans.kode_kantor, tabtrans.kuitansi,
                            tabtrans.tgl_trans, tabtrans.jam, tabtrans.pokok, tabtrans.user_id,
                            tabtrans.ip_add, tabtrans.kode_trans, '100', tabtrans.keterangan,
                            'TAB', tabtrans.tabtrans_id, 'O', tabtrans.kuitansi_id, tabtrans.sandi_trans,
                            tabtrans.verifikasi, '1'], function (err) {
                            if (err) {
                                res = false;
                                console.error(`ERROR INSERT TABTRANS VS ${err.message}`);
                            } else {
                                module.exports.RepostingSaldoTabungan(tabtrans.no_rekening_vs, tabtrans.tgl_trans);
                            }
                        });
                    connection.release();
                });
            }
        }
        if (tabtrans.no_rekening_aba !== '' && tabtrans.kode_trans === kodetrans.tabungan.kodeTransTarikABA) {
            transIdVs = await global_function.GenerateTransID(tabtrans.user_id);
            let abaPokok = '';
            switch (kodeIntegrasiABA.substring(0, 1)) {
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
            if (transIdVs > 0 && tabtrans.pokok > '0') {
                pool.getConnection(function (err, connection) {
                    let sqlStringABA = 'INSERT INTO abatrans(abatrans_id,no_rekening,kode_kantor,kuitansi,tgl_trans,' +
                        'jam, ' + abaPokok + ' ,userid,ip_add,kode_trans,my_kode_trans,keterangan,modul_id_source,trans_id_source,' +
                        'tob,kuitansi_id,verifikasi,transfer)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                    connection.query(sqlStringABA,
                        [transIdVs, tabtrans.no_rekening_aba, tabtrans.kode_kantor, tabtrans.kuitansi,
                            tabtrans.tgl_trans, tabtrans.jam, tabtrans.pokok, tabtrans.user_id,
                            tabtrans.ip_add, tabtrans.kode_trans, '200', tabtrans.keterangan,
                            'TAB', tabtrans.tabtrans_id, 'O', tabtrans.kuitansi_id,
                            tabtrans.verifikasi, '1'], function (err) {
                            if (err) {
                                res = false;
                                console.error(`ERROR INSERT ABATRANS VS ${err.message}`);
                            } else {
                                module.exports.RepostingSaldoABA(tabtrans.no_rekening_aba, tabtrans.tgl_trans);
                            }
                        });
                    connection.release();
                });
            }
        }
        let kodePerkiraanSimpanan = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', tabtrans.kode_integrasi);
        let kodePerkKas = '';
        if (tabtrans.kode_trans === kodetrans.tabungan.kodeTransTarikTunai) {
            kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', tabtrans.user_id);
        } else if (tabtrans.kode_trans === kodetrans.tabungan.kodeTransTransfer) {
            kodePerkKas = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', tabtrans.kode_integrasi_vs);
        } else if (tabtrans.kode_trans === kodetrans.tabungan.kodeTransTarikCoa) {
            kodePerkKas = tabtrans.kode_perk_ob;
        } else if (tabtrans.kode_trans === kodetrans.tabungan.kodeTransTarikABA) {
            kodePerkKas = await global_function.GetValByKeyValString('perk_pokok', 'aba_integrasi', 'kode_aba', kodeIntegrasiABA);

        }
        if (tabtrans.pokok > '0') {
            let transIdMaster = await global_function.GenerateTransID(tabtrans.user_id);
            let transMaster = await global_function.InsertTransaksiMaster(transIdMaster, 'TAB', tabtrans.kuitansi,
                tabtrans.tgl_trans, tabtrans.keterangan, 'TAB', tabtrans.tabtrans_id, tabtrans.user_id,
                tabtrans.kode_kantor, tabtrans.kuitansi_id, '1');
            if (transMaster) {
                let transIdDetail = await global_function.GenerateTransID(tabtrans.user_id);
                res = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkiraanSimpanan,
                    tabtrans.pokok, '0', tabtrans.kode_kantor, tabtrans.keterangan);
                transIdDetail = await global_function.GenerateTransID(tabtrans.user_id);
                res = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkKas,
                    '0', tabtrans.pokok, tabtrans.kode_kantor, tabtrans.keterangan);
            }
        }
        return res;
    },
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
