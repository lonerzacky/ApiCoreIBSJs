const moment = require('moment');
const pool = require('../config/pooling');
const utility = require('../helpers/utility');
const global_function = require('../helpers/global_function');
const tabtrans = require('../setter-getter/tabtrans');
const crudtabung = require('../crud/crudtabung');
const apicode = require('../constants/apicode');
const kodetrans = require('../constants/kodetrans');
const saldo = require('../helpers/saldo');

module.exports = {
    HandlerTransTabungan: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.account_number === '' || !params.account_number) {
            resperrParam += 'MISSING ACCOUNT NUMBER PARAMETER\n';
            errParam++;
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.account_number);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "ACCOUNT NUMBER IS NOT FOUND"));
        }
        if (params.client_id === '' || !params.client_id) {
            resperrParam += 'MISSING CLIENT ID PARAMETER\n';
            errParam++;
        }
        if (params.trx_number === '' || !params.trx_number) {
            resperrParam += 'MISSING TRX NO PARAMETER\n';
            errParam++;
        }
        if (params.trx_ref_id === '' || !params.trx_ref_id) {
            resperrParam += 'MISSING TRX REF ID PARAMETER\n';
            errParam++;
        }
        if (params.date_transaction === '' || !params.date_transaction) {
            resperrParam += 'MISSING TRANSACTION DATE PARAMETER\n';
            errParam++;
        }
        if (params.my_trans_code === '' || !params.my_trans_code) {
            resperrParam += 'MISSING MY TRANS CODE PARAMETER\n';
            errParam++;
        }
        if (params.hour_transaction === '' || !params.hour_transaction) {
            resperrParam += 'MISSING HOUR TRANSACTION PARAMETER\n';
            errParam++;
        }
        if (params.trx_amount === '' || !params.trx_amount) {
            resperrParam += 'MISSING TRX AMOUNT PARAMETER\n';
            errParam++;
        }
        if (params.trans_code === '' || !params.trans_code) {
            resperrParam += 'MISSING TRANS CODE PARAMETER\n';
            errParam++;
        }
        if (params.ip_add === '' || !params.ip_add) {
            resperrParam += 'MISSING IP ADDRESS PARAMETER\n';
            errParam++;
        }
        if (params.trx_description === '' || !params.trx_description) {
            resperrParam += 'MISSING TRX DESCRIPTION PARAMETER\n';
            errParam++;
        }
        if (params.trans_code === kodetrans.tabungan.kodeTransTarikTunai || params.trans_code === kodetrans.tabungan.kodeTransSetorTunai) {
            let kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', process.env.APIUSERID);
            if (kodePerkKas === '') {
                return res.send(utility.GiveResponse("01", "USER ACCOUNT CODE IS NOT DEFINED"));
            }
            if (params.trans_code === kodetrans.tabungan.kodeTransTarikTunai) {

                let saldoKas = await global_function.GetAccSaldoPerk(kodePerkKas, params.client_id, params.date_transaction, process.env.APIUSERID);
                if (saldoKas < parseFloat(params.trx_amount)) {
                    return res.send(utility.GiveResponse("01", "INSUFFICIENT CASH BALANCE!"));
                }
            }
        }
        if (params.trans_code === kodetrans.tabungan.kodeTransTransfer) {
            if (params.account_number_vs === '') {
                return res.send(utility.GiveResponse("00", "VERSUS ACCOUNT NUMBER MUST BE COMPLETED"));
            } else {
                let existNoRekeningVs = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.account_number_vs);
                if (existNoRekeningVs === '') {
                    return res.send(utility.GiveResponse("01", "VERSUS ACCOUNT NUMBER IS NOT FOUND"));
                }
            }
        }
        if (params.trans_code === kodetrans.tabungan.kodeTransSetorCoa || params.trans_code === kodetrans.tabungan.kodeTransTarikCoa) {
            if (params.ob_coa_code === '') {
                return res.send(utility.GiveResponse("00", "OVERBOOKING ACCOUNT CODE IS NOT DEFINED"));
            } else {
                let existKodePerkOb = await global_function.GetValByKeyValString('kode_perk', 'perkiraan', 'kode_perk', params.ob_coa_code);
                if (existKodePerkOb === '') {
                    return res.send(utility.GiveResponse("01", "OVERBOOKING ACCOUNT CODE IS NOT FOUND"));
                }
            }
            let flagMinus = await global_function.GetValByKeyValString('flag_minus', 'perkiraan', 'kode_perk', params.ob_coa_code);
            let saldoPerk = await global_function.GetAccSaldoPerkDetail(params.ob_coa_code, params.client_id, params.date_transaction);
            if (params.trans_code === kodetrans.tabungan.kodeTransSetorCoa) {
                if (params.ob_coa_code.substring(0, 1) === '2' || params.ob_coa_code.substring(0, 1) === '4') {
                    if (flagMinus !== '1') {
                        if (saldoPerk < parseFloat(params.trx_amount)) {
                            return res.send(utility.GiveResponse("01", "INSUFFICIENT [" + params.ob_coa_code + "] ACCOUNT CODE"));
                        }
                    }
                }
            }
            if (params.trans_code === kodetrans.tabungan.kodeTransTarikCoa) {
                if (params.ob_coa_code.substring(0, 1) === '1' || params.ob_coa_code.substring(0, 1) === '5') {
                    if (flagMinus !== '1') {
                        if (saldoPerk < parseFloat(params.trx_amount)) {
                            return res.send(utility.GiveResponse("01", "INSUFFICIENT [" + params.ob_coa_code + "] ACCOUNT CODE!"));
                        }
                    }
                }
            }
        }
        if (params.trans_code === kodetrans.tabungan.kodeTransSetorABA || params.trans_code === kodetrans.tabungan.kodeTransTarikABA) {
            if (params.account_number_aba === '') {
                return res.send(utility.GiveResponse("00", "ABA ACCOUNT NUMBER MUST BE COMPLETED"));
            } else {
                let existNoRekeningABA = await global_function.GetValByKeyValString('no_rekening', 'aba', 'no_rekening', params.account_number_aba);
                if (existNoRekeningABA === '') {
                    return res.send(utility.GiveResponse("01", "ABA ACCOUNT NUMBER IS NOT FOUND"));
                }
            }
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        let kode_integrasi = await global_function.GetValByKeyValString('kode_integrasi', 'tabung', 'no_rekening', params.account_number);
        if (kode_integrasi === '') {
            responseBody = utility.GiveResponse("01", "SAVINGS INTEGRATION CODES WAS NOT FOUND");
            global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
            return res.send(responseBody);
        }
        let status = await global_function.GetValByKeyValString('status', 'tabung', 'no_rekening', params.account_number);
        if (status === '3' || status === '4') {
            responseBody = utility.GiveResponse("01", "TRANSACTION DENIED! ACCOUNT NUMBER IS BLOCKED");
            global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
            return res.send(responseBody);
        }
        let sandiTrans = await global_function.GetValByKeyValString('sandi_trans_default', 'tab_kode_trans', 'kode_trans', params.trans_code);
        let kodePerkSimpanan = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', kode_integrasi);
        if (kodePerkSimpanan === '') {
            responseBody = utility.GiveResponse("01", "LOAD SAVINGS INTEGRATION FAILED, PLEASE SETTING SAVINGS INTEGRATION IMMEDIATELY");
            global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
            return res.send(responseBody);
        }
        let kode_integrasi_vs = '';
        if (params.trans_code === kodetrans.tabungan.kodeTransSetorTunai || params.trans_code === kodetrans.tabungan.kodeTransTarikTunai) {
            let kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', process.env.APIUSERID);
            if (kodePerkKas === '') {
                responseBody = utility.GiveResponse("01", "LOAD CASH CODE FAILED!, PLEASE SETTING CASH CODE USER INTEGRATION IMMEDIATELY");
                global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                return res.send(responseBody);
            }
        } else {
            if (params.trans_code === kodetrans.tabungan.kodeTransTransfer) {
                kode_integrasi_vs = await global_function.GetValByKeyValString('kode_integrasi', 'tabung', 'no_rekening', params.account_number_vs);
                if (kode_integrasi_vs === '') {
                    responseBody = utility.GiveResponse("01", "SAVINGS INTEGRATION VERSUS CODES WAS NOT FOUND");
                    global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                    return res.send(responseBody);
                }
                let kodePerkSimpananVs = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', kode_integrasi_vs);
                if (kodePerkSimpananVs === '') {
                    responseBody = utility.GiveResponse("01", "LOAD SAVINGS INTEGRATION VERSUS FAILED, PLEASE SETTING SAVINGS INTEGRATION VERSUS IMMEDIATELY");
                    global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                    return res.send(responseBody);
                }
            } else {
                if (params.trans_code === kodetrans.tabungan.kodeTransSetorABA || params.trans_code === kodetrans.tabungan.kodeTransTarikABA) {
                    let kodeIntegrasiABA = await global_function.GetValByKeyValString('kode_integrasi', 'aba', 'no_rekening', params.account_number_aba);
                    let kodePerkSimpananABA = await global_function.GetValByKeyValString('perk_pokok', 'aba_integrasi', 'kode_aba', kodeIntegrasiABA);
                    if (kodePerkSimpananABA === '') {
                        responseBody = utility.GiveResponse("01", "LOAD ABA INTEGRATION FAILED, PLEASE SETTING ABA INTEGRATION IMMEDIATELY");
                        global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                        return res.send(responseBody);
                    }
                }
            }
        }
        if (await global_function.IsKuitansiExist('kuitansi_id', 'tabtrans', 'kuitansi_id', params.trx_ref_id, 'no_rekening', params.account_number)) {
            return res.send(utility.GiveResponse("01", "DUPLICATE " + params.trx_ref_id + " TRX ID"));
        }
        let transId = await global_function.GenerateTransID(process.env.APIUSERID);
        if (transId === 0) {
            responseBody = utility.GiveResponse("01", "GENERATE TRANS ID FAILED, PLEASE TRY AGAIN");
            global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
            return res.send(responseBody);
        }
        let tob = '';
        if (params.trans_code === kodetrans.tabungan.kodeTransSetorTunai || params.trans_code === kodetrans.tabungan.kodeTransTarikTunai) {
            tob = 'T';
        } else {
            tob = 'O';
        }
        pool.getConnection(function (err, connection) {
            let sqlString = `INSERT INTO tabtrans(tabtrans_id,no_rekening,kode_kantor,kuitansi,tgl_trans,
                        jam,pokok,userid,ip_add,kode_trans,my_kode_trans,keterangan,trans_id_source,
                        tob,kuitansi_id,sandi_trans,verifikasi,no_rekening_aba,no_rekening_vs,transfer)
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            connection.query(sqlString,
                [transId, params.account_number, params.client_id, params.trx_number,
                    params.date_transaction, params.hour_transaction, params.trx_amount, process.env.APIUSERID,
                    params.ip_add, params.trans_code, params.my_trans_code, params.trx_description,
                    params.tabtrans_id, tob, params.trx_ref_id, sandiTrans,
                    '1', params.account_number_aba, params.account_number_vs, "1"], function (err) {
                    if (err) {
                        console.error(`INSERT TABTRANS ERROR: ${err.message}`);
                        responseBody = utility.GiveResponse("01", "SAVING TRANSACTION FAILED");
                    } else {
                        let respData = {
                            'trans_id': transId,
                            'trx_ref_id': params.trx_ref_id
                        };
                        tabtrans.tabtrans_id = transId;
                        tabtrans.no_rekening = params.account_number;
                        tabtrans.kode_kantor = params.client_id;
                        tabtrans.kuitansi = params.trx_number;
                        tabtrans.no_rekening_vs = params.account_number_vs;
                        tabtrans.user_id = process.env.APIUSERID;
                        tabtrans.pokok = params.trx_amount;
                        tabtrans.tgl_trans = params.date_transaction;
                        tabtrans.jam = params.hour_transaction;
                        tabtrans.ip_add = params.ip_add;
                        tabtrans.kode_trans = params.trans_code;
                        tabtrans.keterangan = params.trx_description;
                        tabtrans.kuitansi_id = params.trx_ref_id;
                        tabtrans.sandi_trans = sandiTrans;
                        tabtrans.my_kode_trans = params.my_trans_code;
                        tabtrans.verifikasi = '1';
                        tabtrans.kode_integrasi = kode_integrasi;
                        tabtrans.kode_integrasi_vs = kode_integrasi_vs;
                        tabtrans.kode_perk_ob = params.ob_coa_code;
                        tabtrans.no_rekening_aba = params.account_number_aba;
                        let result = crudtabung.AddTransTabungan(tabtrans);
                        if (result) {
                            saldo.RepostingSaldoTabungan(params.account_number, params.date_transaction);
                            responseBody = utility.GiveResponse("00", "SAVING TRANSACTION SUCCESS", respData);
                        } else {
                            responseBody = utility.GiveResponse("01", "SAVING TRANSACTION FAILED");
                            global_function.DeleteTrans('abatrans', 'trans_id_source', transId);
                            global_function.DeleteTrans('tabtrans', 'trans_id_source', transId);
                            global_function.DeleteTrans('transaksi_master', 'trans_id_source', transId);
                            global_function.DeleteTrans('tabtrans', 'tabtrans_id', transId);
                        }
                    }
                    global_function.InsertLogService(apicode.apiCodeTransTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                    return res.send(responseBody);
                });
            connection.release();
        })
    },
    HandlerInquirySaldo: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        if (params.account_number === '' || !params.account_number) {
            return res.send(utility.GiveResponse("01", "ACCOUNT NUMBER MUST BE COMPLETED"));
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.account_number);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "SAVING ACCOUNT NUMBER IS NOT FOUND"));
        }

        if (params.client_id === '' || !params.client_id) {
            return res.send(utility.GiveResponse("01", "CLIENT ID MUST BE COMPLETED"));
        }
        let saldoAkhir = await saldo.GetSaldoAkhirTabungan(params.account_number, moment().format('YYYYMMDD'));
        pool.getConnection(function (err, connection) {
            let sqlString = `SELECT no_rekening,nama_nasabah,kode_integrasi FROM tabung
            LEFT JOIN nasabah ON tabung.nasabah_id = nasabah.nasabah_id WHERE tabung.kode_kantor = ?  AND (
            tabung.STATUS NOT IN ( 2 )) AND tabung.verifikasi > 0  AND no_rekening = ? LIMIT 1`;
            connection.query(sqlString,
                [params.client_id, params.account_number], function (err, rows) {
                    if (err) {
                        console.error(`SELECT DATA ERROR: ${err.message}`);
                        responseBody = utility.GiveResponse("01", "INQUIRY BALANCE FAILED");
                    } else {
                        let infoInquiry = {
                            account_number: rows[0].no_rekening,
                            customer_name: rows[0].nama_nasabah,
                            integration_code: rows[0].kode_integrasi,
                            balance: saldoAkhir.toString()
                        };
                        responseBody = utility.GiveResponse("00", "INQUIRY BALANCE SUCCESS", infoInquiry);
                    }
                    global_function.InsertLogService(apicode.apiCodeInquirySaldo, params, responseBody, params.client_id, process.env.APIUSERID);
                    return res.send(responseBody);
                });
            connection.release();
        });
    },
    HandlerInquiryRekening: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        if (params.account_number === '' || !params.account_number) {
            return res.send(utility.GiveResponse("01", "ACCOUNT NUMBER MUST BE COMPLETED"));
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.account_number);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "ACCOUNT NUMBER IS NOT FOUND"));
        }
        if (params.client_id === '' || !params.client_id) {
            return res.send(utility.GiveResponse("01", "CLIENT ID MUST BE COMPLETED"));
        }
        let saldoAkhir = await saldo.GetSaldoAkhirTabungan(params.account_number, moment().format('YYYYMMDD'));
        pool.getConnection(function (err, connection) {
            let sqlString = `SELECT no_rekening,nama_nasabah,nama_ibu_kandung,alamat,jenis_kelamin,
            tempatlahir,tgllahir,tabung.tgl_register,no_id,tabung.no_alternatif,
            tab_produk.kode_produk,tab_produk.deskripsi_produk,tabung.kode_integrasi FROM tabung
            LEFT JOIN nasabah ON tabung.nasabah_id = nasabah.nasabah_id 
            LEFT JOIN tab_produk ON tabung.kode_produk = tab_produk.kode_produk
            WHERE tabung.kode_kantor = ?  AND (
            tabung.STATUS NOT IN ( 2 )) AND tabung.verifikasi > 0  AND no_rekening = ? LIMIT 1`;
            connection.query(sqlString,
                [params.client_id, params.account_number], function (err, rows) {
                    if (err) {
                        console.error(`SELECT DATA ERROR: ${err.message}`);
                        responseBody = utility.GiveResponse("01", "INQUIRY REKENING TABUNGAN GAGAL");
                    } else {
                        let infoInquiry = {
                            account_number: rows[0].no_rekening,
                            customer_name: rows[0].nama_nasabah,
                            mothers_name: rows[0].nama_ibu_kandung,
                            address: rows[0].alamat,
                            gender: rows[0].jenis_kelamin,
                            place_of_birth: rows[0].tempatlahir,
                            date_of_birth: rows[0].tgllahir,
                            registrasion_date: rows[0].tgl_register,
                            id_number: rows[0].no_id,
                            alternative_number: rows[0].no_alternatif,
                            product_code: rows[0].kode_produk,
                            product_description: rows[0].deskripsi_produk,
                            integration_code: rows[0].kode_integrasi,
                            balance: saldoAkhir.toString()
                        };
                        responseBody = utility.GiveResponse("00", "INQUIRY BALANCE SUCCESS", infoInquiry);
                    }
                    global_function.InsertLogService(apicode.apiCodeInquirySaldo, params, responseBody, params.client_id, process.env.APIUSERID);
                    return res.send(responseBody);
                });
            connection.release();
        });
    },
    HandlerMutasiTabungan: async function (req, res) {
        let params = req.body;
        let responseBody = '';
        let resperrParam = '';
        let errParam = 0;
        if (params.client_id === '' || !params.client_id) {
            resperrParam += 'MISSING CLIENT ID PARAMETER\n';
            errParam++;
        }
        if (params.start_date === '' || !params.start_date) {
            resperrParam += 'MISSING START DATE PARAMETER\n';
            errParam++;
        }
        if (params.end_date === '' || !params.end_date) {
            resperrParam += 'MISSING END DATE PARAMETER\n';
            errParam++;
        }
        if (params.account_number === '' || !params.account_number) {
            resperrParam += 'MISSING ACCOUNT NUMBER PARAMETER\n';
            errParam++;
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.account_number);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "SAVING ACCOUNT NUMBER IS NOT FOUND"));
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse("00", resperrParam));
        }
        pool.getConnection(function (err, connection) {
            let sqlString = 'SET @saldoawal:=(SELECT COALESCE(SUM(IF(FLOOR(my_kode_trans/100)=1,pokok,0))-SUM(IF(FLOOR(my_kode_trans/100)=2,pokok,0)),0) ' +
                'FROM tabtrans WHERE tgl_trans< "' + params.start_date + '" and no_rekening="' + params.account_number + '")';
            connection.query(sqlString, function (err) {
                if (err) {
                    console.error(`SET SALDO AWAL ERROR: ${err.message}`);
                    responseBody = utility.GiveResponse("01", "EARLY SAVINGS BALANCE SET FAILED");
                    global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                    res.send(responseBody);
                } else {
                    connection.query(`SELECT @saldoawal AS saldo_awal`, function (err, rowSaldoAwal) {
                        if (err) {
                            console.error(`SET SALDO AWAL ERROR: ${err.message}`);
                            responseBody = utility.GiveResponse("01", "EARLY SAVINGS BALANCE SELECT FAILED");

                            global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                            return res.send(responseBody);
                        } else {
                            sqlString = `SELECT tgl_trans,tt.no_rekening,tt.keterangan,kuitansi,my_kode_trans,tt.userid,
                            IF( floor( my_kode_trans / 100 )= 1, pokok, 0 ) setoran,IF ( floor( my_kode_trans / 100 )= 2, pokok, 0 ) penarikan,
                            @saldoawal := @saldoawal + IF( floor( my_kode_trans / 100 )= 1, pokok, 0 )- 
                            IF ( floor( my_kode_trans / 100 )= 2, pokok, 0 ) saldo_akhir FROM tabtrans tt, tabung t 
                            WHERE tt.no_rekening = t.no_rekening AND tt.kode_kantor = ? AND tgl_trans >= ? AND tgl_trans <= ? 
                            AND tt.no_rekening = ? ORDER BY tgl_trans,tabtrans_id`;
                            connection.query(sqlString, [params.client_id,
                                params.start_date, params.end_date, params.account_number], function (err, rows) {
                                if (err) {
                                    console.error(`SELECT MUTASI SALDO ERROR: ${err.message}`);
                                    responseBody = utility.GiveResponse("01", "SELECT MUTATION SAVINGS FAILED");
                                    global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, responseBody, params.client_id, process.env.APIUSERID);
                                    return res.send(responseBody);
                                } else {
                                    let arrInfo = [];
                                    for (let i = 0; i < rows.length; i++) {
                                        let row = rows[i];
                                        let responseArray = {
                                            transaction_date: row.tgl_trans,
                                            account_number: row.no_rekening,
                                            description: row.keterangan,
                                            trx_no: row.kuitansi,
                                            my_trans_code: row.my_kode_trans,
                                            userid: row.userid,
                                            credit: row.setoran,
                                            debet: row.penarikan,
                                            balance: row.saldo_akhir,
                                        };
                                        arrInfo.push(responseArray);
                                    }
                                    responseBody = {
                                        response_code: "00",
                                        response_message: "SUCCESSFULLY GET MUTATION SAVINGS",
                                        early_saving: rowSaldoAwal[0].saldo_awal.toString(),
                                        response_data: arrInfo
                                    };
                                    global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, JSON.stringify(responseBody), params.client_id, process.env.APIUSERID);
                                    return res.json(responseBody);
                                }
                            });
                        }
                    });
                }
            });
            connection.release();
        });
    },
    HandlerForwardingPayment: async function (req, res) {
        let params = req.body;
        let resperrParam = '';
        let errParam = 0;
        if (params.txid === '' || !params.txid) {
            resperrParam += 'MISSING TX ID PARAMETER\n';
            errParam++;
        }
        if (params.oy_txid === '' || !params.oy_txid) {
            resperrParam += 'MISSING OY TX ID PARAMETER\n';
            errParam++;
        }
        if (params.nominal === '' || !params.nominal) {
            resperrParam += 'MISSING NOMINAL PARAMETER\n';
            errParam++;
        }
        if (params.name === '' || !params.name) {
            resperrParam += 'MISSING NAME PARAMETER\n';
            errParam++;
        }
        if (params.phone_number === '' || !params.phone_number) {
            resperrParam += 'MISSING PHONE NUMBER PARAMETER\n';
            errParam++;
        }
        if (params.note === '' || !params.note) {
            resperrParam += 'MISSING NOTE PARAMETER\n';
            errParam++;
        }
        if (params.result === '' || !params.result) {
            resperrParam += 'MISSING RESULT PARAMETER\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('01', resperrParam));
        } else {
            return res.send(utility.GiveResponse('00', "TRANSACTION SUCCESS"));
        }
    }
};
