const moment = require('moment');
const pool = require('../config/pooling');
const poolSys = require('../config/pooling_sys');
const utility = require("../helpers/utility");

// noinspection JSUnresolvedVariable
module.exports = {
    GetValByKeyValString: function (field, table, key, val) {
        return new Promise(resolve => {
            let valReturn;
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT ' + field + ' FROM ' + table + ' WHERE ' + key + '="' + val + '"';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        valReturn = rows[0][field];
                    } else {
                        valReturn = '';
                    }
                    resolve(valReturn.toString());
                });
                connection.release();
            });
        });
    },
    GetValByKeyValStringSys: function (field, table, key, val) {
        return new Promise(resolve => {
            let valReturn;
            poolSys.getConnection(function (err, connection) {
                let sqlString = 'SELECT ' + field + ' FROM ' + table + ' WHERE ' + key + '="' + val + '"';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        valReturn = rows[0][field];
                    } else {
                        valReturn = '';
                    }
                    resolve(valReturn.toString());
                });
                connection.release();
            });
        });
    },
    GetSysMySysIdValue: function (key) {
        return new Promise(resolve => {
            let valReturn;
            poolSys.getConnection(function (err, connection) {
                let sqlString = 'SELECT keyvalue FROM sys_mysysid WHERE keyname="' + key + '"';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        // noinspection JSUnresolvedVariable
                        valReturn = rows[0].keyvalue;
                    } else {
                        valReturn = '';
                    }
                    resolve(valReturn.toString());
                });
                connection.release();
            });
        });
    },
    IsKuitansiExist: function (FieldName, Table, Key, Val, KeyLast, ValLast) {
        return new Promise(resolve => {
            let strValLast = '';
            let result = false;
            if (ValLast !== '') {
                strValLast = ' AND ' + KeyLast + ' = "' + ValLast + '"';
            }
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT COUNT( ' + FieldName + ') AS jml FROM ' + Table + ' WHERE ' + Key + ' = "' + Val + '" ' + strValLast;
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        // noinspection JSUnresolvedVariable
                        result = rows[0].jml === 1;
                    } else {
                        result = false;
                    }
                    resolve(result);
                });
                connection.release();
            });
        })
    },
    GenerateTransID: function (UserId) {
        return new Promise(resolve => {
            pool.getConnection(function (err, connection) {
                let transId;
                let sqlString = 'DELETE FROM my_id_generator WHERE userid = "' + UserId + '"';
                connection.query(sqlString, function (err) {
                    if (err) {
                        transId = 0;
                        console.error(err.message);
                    } else {
                        sqlString = `insert into my_id_generator (userid) values (?)`;
                        connection.query(sqlString, UserId, function (err) {
                            if (err) {
                                transId = 0;
                                console.error(err.message);
                            } else {
                                sqlString = `SELECT MAX(next_id) as trans_id FROM my_id_generator WHERE userid=?`;
                                connection.query(sqlString, UserId, function (err, rows) {
                                    if (!err && rows.length > 0) {
                                        transId = rows[0].trans_id;
                                    } else {
                                        transId = 0;
                                    }
                                    resolve(transId);
                                });
                            }
                        });
                    }
                });
                connection.release();
            });
        })
    },
    InsertTransaksiMaster: function (trans_id, kode_jurnal, no_bukti, tgl_trans, uraian, modul_id_source,
                                     trans_id_source, user_id, kode_kantor, kuitansi_id, transfer) {
        return new Promise(resolve => {
            let result = false;
            pool.getConnection(function (err, connection) {
                let sqlString = `INSERT INTO transaksi_master (trans_id, kode_jurnal, no_bukti, tgl_trans,
                uraian, modul_id_source, trans_id_source, userid, kode_kantor,kuitansi_id, transfer) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
                connection.query(sqlString, [trans_id, kode_jurnal, no_bukti, tgl_trans, uraian,
                    modul_id_source, trans_id_source, user_id, kode_kantor, kuitansi_id, transfer], function (err) {
                    if (err) {
                        result = false;
                        console.error(err.message);
                    } else {
                        result = true;
                        resolve(result);
                    }
                });
                connection.release();
            });
        });
    },
    InsertTransaksiDetail: function (trans_id, master_id, kode_perk, debet, kredit, kode_kantor, keterangan) {
        return new Promise(resolve => {
            let result = false;
            pool.getConnection(function (err, connection) {
                let sqlString = `INSERT INTO transaksi_detail 
            (trans_id, master_id, kode_perk, debet, kredit, kode_kantor_detail, keterangan) VALUES (?,?,?,?,?,?,?)`;
                connection.query(sqlString, [trans_id, master_id, kode_perk, debet, kredit,
                    kode_kantor, keterangan], function (err) {
                    if (err) {
                        result = false;
                        console.error(err.message);
                    } else {
                        result = true;
                        resolve(result);
                    }
                });
                connection.release();
            });
        });
    },
    InsertLogService: function (apicode, request, respon, kode_kantor, user_id) {
        pool.getConnection(function (err, connection) {
            let tglTrans = moment().format("YYYY-MM-DD");
            let jamTrans = moment().format("HH:mm:ss");
            let sqlString = `INSERT INTO logservice 
            (tgl_trans, jam_trans, apicode, request, respon, kode_kantor, user_id) VALUES (?,?,?,?,?,?,?)`;
            connection.query(sqlString, [tglTrans, jamTrans, apicode, JSON.stringify(request), respon,
                kode_kantor, user_id], function (err) {
                if (err) {
                    console.error(err.message);
                }
            });
            connection.release();
        });
    },
    GetAccSaldoPerk: function (kode_perk, kode_kantor, tgl, user_id = '') {
        return new Promise(resolve => {
            let saldoPerk;
            let qUserId = '';
            if (user_id !== '') {
                qUserId = 'AND userid="' + user_id + '"';
            }
            pool.getConnection(function (err, connection) {
                let sqlString = 'select transaksi_master.kode_kantor,' +
                    'sum(if(tgl_trans<="' + tgl + '" and kode_jurnal<>"CLS",transaksi_detail.debet,0)) as debet_mutasi,' +
                    'sum(if(tgl_trans<="' + tgl + '" and kode_jurnal<>"CLS",transaksi_detail.kredit,0)) as kredit_mutasi ' +
                    'from transaksi_master,transaksi_detail ' +
                    'where transaksi_master.trans_id=transaksi_detail.master_id ' +
                    'and transaksi_master.kode_kantor=transaksi_detail.kode_kantor_detail ' +
                    'and tgl_trans<="' + tgl + '" and transaksi_master.kode_kantor="' + kode_kantor + '" ' +
                    'and transaksi_detail.kode_perk="' + kode_perk + '" ' + qUserId + ' ' +
                    'group by kode_kantor, kode_perk ';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        // noinspection JSUnresolvedVariable
                        saldoPerk = rows[0].debet_mutasi - rows[0].kredit_mutasi;
                    } else {
                        saldoPerk = 0;
                    }
                    resolve(saldoPerk);
                });
                connection.release();
            });
        });
    },
    GetAccSaldoPerkDetail: function (kode_perk, kode_kantor, tgl) {
        return new Promise(resolve => {
            let nSaldoAwal = '';
            let nSaldoPerk = '';
            pool.getConnection(function (err, connection) {
                let sqlString = 'select transaksi_master.kode_kantor, perkiraan.kode_perk, perkiraan.id_perk, perkiraan.d_or_k, ' +
                    'sum(if(tgl_trans<"' + tgl + '",debet,0)) as debet_awal, ' +
                    'sum(if(tgl_trans<"' + tgl + '",kredit,0)) as kredit_awal,  ' +
                    'sum(if(tgl_trans>="' + tgl + '" and tgl_trans<="' + tgl + '" and kode_jurnal<>"CLS",debet,0)) as debet_mutasi, ' +
                    'sum(if(tgl_trans>="' + tgl + '" and tgl_trans<="' + tgl + '" and kode_jurnal<>"CLS",kredit,0)) as kredit_mutasi ' +
                    'from transaksi_master,transaksi_detail,perkiraan ' +
                    'where transaksi_master.trans_id=transaksi_detail.master_id ' +
                    'and transaksi_master.kode_kantor=transaksi_detail.kode_kantor_detail ' +
                    'and transaksi_detail.kode_perk=perkiraan.kode_perk ' +
                    'and tgl_trans<="' + tgl + '" and transaksi_master.kode_kantor="' + kode_kantor + '" ' +
                    'and transaksi_detail.kode_perk="' + kode_perk + '" ';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        // noinspection JSUnresolvedVariable
                        if (rows[0].d_or_k === 'D') {
                            // noinspection JSUnresolvedVariable
                            nSaldoAwal = rows[0].debet_awal - rows[0].kredit_awal;
                            // noinspection JSUnresolvedVariable
                            nSaldoPerk = nSaldoAwal + rows[0].debet_mutasi - rows[0].kredit_mutasi;
                        } else {
                            // noinspection JSUnresolvedVariable
                            nSaldoAwal = rows[0].kredit_awal - rows[0].debet_awal;
                            // noinspection JSUnresolvedVariable
                            nSaldoPerk = nSaldoAwal + rows[0].kredit_mutasi - rows[0].debet_mutasi;
                        }
                    } else {
                        nSaldoPerk = 0;
                    }
                    resolve(parseFloat(nSaldoPerk).toFixed(2));
                });
                connection.release();
            });
        });
    },
    DeleteTrans: function (table, key, trans_id) {
        if (trans_id !== 0) {
            pool.getConnection(function (err, connection) {
                let sqlString = 'delete from ' + table + ' where ' + key + '= "' + trans_id + '" ';
                connection.query(sqlString, function (err) {
                    if (err) {
                        console.error(err.message);
                    }
                });
                connection.release();
            });
        }
    },
    GenerateNasabahId: function () {
        return new Promise(resolve => {
            let nasabahId = '';
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT GENERATE_NASABAH_ID(0, 8) AS nasabah_id';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        nasabahId = rows[0].nasabah_id;
                    } else {
                        nasabahId = 0;
                    }
                    resolve(nasabahId);
                });
                connection.release();
            });
        });
    },
    GenerateKuitansiId: function (kode_kantor, tgl_trans) {
        return new Promise(resolve => {
            let kuitansiId = '';
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT GENERATE_KUITANSI(' + kode_kantor + ',' + process.env.APIUSERID + ',' + tgl_trans + ') kuitansi ';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        kuitansiId = rows[0].kuitansi;
                    } else {
                        kuitansiId = 0;
                    }
                    resolve(kuitansiId);
                });
                connection.release();
            });
        });
    },
    GenerateKuitansi: function (kode_kantor, tgl_trans, setting) {
        return new Promise(resolve => {
            let kuitansi = '';
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT GENERATE_KUITANSI_CLIENT(' + kode_kantor + ',' + tgl_trans + ') no_kuitansi_client';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        let kuitansiClient = rows[0].no_kuitansi_client;
                        kuitansi = utility.KuitansiClient(setting, kode_kantor, kuitansiClient)
                    } else {
                        kuitansi = 0;
                    }
                    resolve(kuitansi);
                });
                connection.release();
            });
        });
    },
    GetCountCoreProduct: async function () {
        let defaultProduct = await module.exports.GetSysMySysIdValue('TAB_DEFAULT_PRODUK');
        return new Promise(resolve => {
            let arrProduct = defaultProduct.split(";").map(function (val) {
                return +val;
            });
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT kode_produk,jenis,setoran_minimum_default,saldo_minimum_default,' +
                    'suku_bunga_default,pph_default,setoran_pertama_default ' +
                    'FROM tab_produk WHERE kode_produk IN (' + arrProduct + ')';
                connection.query(sqlString, function (err, rows) {
                    if (!err && rows.length > 0) {
                        resolve(rows);
                    } else {
                        resolve('');
                    }
                });
                connection.release();
            });
        });

    },
    GenerateNoRekening: async function (kode_kantor, kode_produk) {
        let template = await module.exports.GetSysMySysIdValue('TAB_TEMPLATE_NO_REKENING');
        let nStart;
        template = template.replace('###', kode_kantor);
        template = template.replace('XXX', kode_produk);
        nStart = template.indexOf('[');
        template.indexOf(']');
        template = template.replace("[", "");
        template = template.replace("]", "");
        let cLeftTemplate = template.substring(0, nStart);
        let nPad = template.length - (nStart);
        return new Promise(resolve => {
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT GENERATE_NOREK_SIMPANAN("' + cLeftTemplate + '"," ' + nPad + '") NO_REKENING';
                connection.query(sqlString, function (err, rows) {
                    resolve(rows[0].NO_REKENING);
                });
                connection.release();
            });
        });
    }
};
