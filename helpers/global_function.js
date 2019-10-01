const moment = require('moment');
const pool = require('../config/pooling');
const poolSys = require('../config/pooling_sys');

// noinspection JSUnresolvedVariable
module.exports = {
    GetValByKeyValString: function (field, table, key, val) {
        return new Promise(resolve => {
            let valReturn;
            pool.getConnection(function (err, connection) {
                let sqlString = 'SELECT ' + field + ' FROM ' + table + ' WHERE ' + key + '="' + val + '"';
                connection.query(sqlString, function (err, rows) {
                    if (err) {
                        valReturn = '';
                        console.log(err.message);
                    } else {
                        valReturn = rows[0][field];
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
                    if (err) {
                        valReturn = '';
                        console.log(err.message);
                    } else {
                        // noinspection JSUnresolvedVariable
                        valReturn = rows[0].keyvalue;
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
                    if (err) {
                        result = false;
                        console.log(err.message);
                    } else {
                        // noinspection JSUnresolvedVariable
                        result = rows[0].jml === 1;
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
                                    if (err) {
                                        transId = 0;
                                        console.log(err.message);
                                    } else {
                                        transId = rows[0].trans_id;
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
    }
};
