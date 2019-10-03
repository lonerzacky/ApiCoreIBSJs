const moment = require('moment');
const pool = require('../config/pooling');
const utility = require('../helpers/utility');
const global_function = require('../helpers/global_function');
const tabtrans = require('../setter-getter/tabtrans');
const crudtabung = require('../crud/crudtabung');
const apicode = require('../constants/apicode');
const kodetrans = require('../constants/kodetrans');

// noinspection JSUnresolvedVariable
module.exports = {
    HandlerTransTarikTabungan: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.no_rekening === '' || !params.no_rekening) {
            resperrParam += 'PARAMETER NO REKENING TIDAK ADA\n';
            errParam++;
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.no_rekening);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "NO REKENING TABUNGAN TIDAK DITEMUKAN"));
        }
        if (params.kode_kantor === '' || !params.kode_kantor) {
            resperrParam += 'PARAMETER KODE KANTOR TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_integrasi === '' || !params.kode_integrasi) {
            resperrParam += 'PARAMETER KODE INTEGRASI TIDAK ADA\n';
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
        if (params.tgl_trans === '' || !params.tgl_trans) {
            resperrParam += 'PARAMETER TGL TRANS TIDAK ADA\n';
            errParam++;
        }
        if (params.jam === '' || !params.jam) {
            resperrParam += 'PARAMETER JAM TIDAK ADA\n';
            errParam++;
        }
        if (params.pokok === '' || !params.pokok) {
            resperrParam += 'PARAMETER POKOK TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_trans === '' || !params.kode_trans) {
            resperrParam += 'PARAMETER KODE TRANS TIDAK ADA\n';
            errParam++;
        }
        if (params.verifikasi === '' || !params.verifikasi) {
            resperrParam += 'PARAMETER VERIFIKASI TIDAK ADA\n';
            errParam++;
        }
        if (params.ip_add === '' || !params.ip_add) {
            resperrParam += 'PARAMETER IP ADDRESS TIDAK ADA\n';
            errParam++;
        }
        if (params.keterangan === '' || !params.keterangan) {
            resperrParam += 'PARAMETER KETERANGAN TIDAK ADA\n';
            errParam++;
        }
        if (params.user_id === '' || !params.user_id) {
            resperrParam += 'PARAMETER USER ID TIDAK ADA\n';
            errParam++;
        }
        if (params.kode_trans === kodetrans.tabungan.kodeTransTarikTunai) {
            let kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', params.user_id);
            if (kodePerkKas === '') {
                return res.send(utility.GiveResponse("01", "KODE PERK KAS USER BELUM TERDEFINISI"));
            } else {
                let saldoKas = await global_function.GetAccSaldoPerk(kodePerkKas, params.kode_kantor, params.tgl_trans, params.user_id);
                if (saldoKas < parseFloat(params.pokok)) {
                    return res.send(utility.GiveResponse("01", "SALDO KAS TIDAK MENCUKUPI!"));
                }
            }
        }
        if (params.kode_trans === kodetrans.tabungan.kodeTransTransfer) {
            if (params.no_rekening_vs === '') {
                return res.send(utility.GiveResponse("00", "NO REK. TUJUAN HARUS TERISI"));
            } else {
                let existNoRekeningVs = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.no_rekening_vs);
                if (existNoRekeningVs === '') {
                    return res.send(utility.GiveResponse("01", "NO REKENING TABUNGAN VS TIDAK DITEMUKAN"));
                }
            }
            if (params.kode_integrasi_vs === '') {
                return res.send(utility.GiveResponse("00", "KODE INTEGRASI REK. TUJUAN HARUS TERISI"));
            }
        }
        if (params.kode_trans === kodetrans.tabungan.kodeTransTarikCoa) {
            if (params.kode_perk_ob === '') {
                return res.send(utility.GiveResponse("00", "KODE PERK OB HARUS TERISI"));
            } else {
                let existKodePerkOb = await global_function.GetValByKeyValString('kode_perk', 'perkiraan', 'kode_perk', params.kode_perk_ob);
                if (existKodePerkOb === '') {
                    return res.send(utility.GiveResponse("01", "KODE PERK OB TIDAK DITEMUKAN"));
                }
            }
            if (params.kode_perk_ob.substring(0, 1) === '1' || params.kode_perk_ob.substring(0, 1) === '5') {
                let saldoPerk = await global_function.GetAccSaldoPerkDetail(params.kode_perk_ob, params.kode_kantor, params.tgl_trans);
                let flagMinus = await global_function.GetValByKeyValString('flag_minus', 'perkiraan', 'kode_perk', params.kode_perk_ob);
                if (flagMinus !== '1') {
                    if (saldoPerk < parseFloat(params.pokok)) {
                        return res.send(utility.GiveResponse("01", "SALDO PERKIRAAN [" + params.kode_perk_ob + "] TIDAK MENCUKUPI!"));
                    }
                }
            }
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        let status = await global_function.GetValByKeyValString('status', 'tabung', 'no_rekening', params.no_rekening);
        if (status === '3' || status === '4') {
            responseBody = utility.GiveResponse("01", "TRANSAKSI DITOLAK,NO. REKENING TABUNGAN DIBLOKIR");
            global_function.InsertLogService(apicode.apiCodeTransTarikTabungan, params, responseBody, params.kode_kantor, params.user_id);
            return res.send(responseBody);
        }
        let sandiTrans = await global_function.GetValByKeyValString('sandi_trans_default', 'tab_kode_trans', 'kode_trans', params.kode_trans);
        let kodePerkSimpanan = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', params.kode_integrasi);
        if (kodePerkSimpanan === '') {
            responseBody = utility.GiveResponse("01", "LOAD KODE SIMPANAN GAGAL, SILAHKAN SETTING INTEGRASI PERKIRAAN");
            global_function.InsertLogService(apicode.apiCodeTransTarikTabungan, params, responseBody, params.kode_kantor, params.user_id);
            return res.send(responseBody);
        }
        if (params.kode_trans === kodetrans.tabungan.kodeTransTarikTunai) {
            let kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', params.user_id);
            if (kodePerkKas === '') {
                responseBody = utility.GiveResponse("01", "LOAD KODE KAS, SILAHKAN SETTING PERKIRAAN USER");
                global_function.InsertLogService(apicode.apiCodeTransTarikTabungan, params, responseBody, params.kode_kantor, params.user_id);
                return res.send(responseBody);
            }
        } else if (params.kode_trans === kodetrans.tabungan.kodeTransTransfer) {
            let kodePerkSimpananVs = await global_function.GetValByKeyValString('kode_perk_hutang_pokok', 'tab_integrasi', 'kode_integrasi', params.kode_integrasi_vs);
            if (kodePerkSimpananVs === '') {
                responseBody = utility.GiveResponse("01", "LOAD KODE SIMPANAN VS GAGAL, SILAHKAN SETTING INTEGRASI PERKIRAAN");
                global_function.InsertLogService(apicode.apiCodeTransTarikTabungan, params, responseBody, params.kode_kantor, params.user_id);
                return res.send(responseBody);
            }
        }

        if (await global_function.IsKuitansiExist('kuitansi_id', 'tabtrans', 'kuitansi_id', params.kuitansi_id, 'no_rekening', params.no_rekening)) {
            return res.send(utility.GiveResponse("01", "KUITANSI " + params.kuitansi_id + " DUPLIKAT"));
        }
        let transId = await global_function.GenerateTransID(params.user_id);
        if (transId === 0) {
            responseBody = utility.GiveResponse("01", "GENERATE TRANS ID GAGAL, SILAHKAN COBA LAGI");
            global_function.InsertLogService(apicode.apiCodeTransTarikTabungan, params, responseBody, params.kode_kantor, params.user_id);
            return res.send(responseBody);
        }

        pool.getConnection(function (err, connection) {
            let sqlString = `INSERT INTO tabtrans(tabtrans_id,no_rekening,kode_kantor,kuitansi,tgl_trans,
                        jam,pokok,userid,ip_add,kode_trans,my_kode_trans,keterangan,modul_id_source,trans_id_source,
                        tob,kuitansi_id,sandi_trans,verifikasi,transfer)
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            connection.query(sqlString,
                [transId, params.no_rekening, params.kode_kantor, params.kuitansi,
                    params.tgl_trans, params.jam, params.pokok, params.user_id,
                    params.ip_add, params.kode_trans, "200", params.keterangan,
                    "TAB", params.tabtrans_id, "O", params.kuitansi_id, sandiTrans,
                    params.verifikasi, "1"], function (err) {
                    if (err) {
                        console.error(`INSERT TABTRANS ERROR: ${err.message}`);
                        responseBody = utility.GiveResponse("01", "TRANSAKSI TABUNGAN GAGAL");
                    } else {
                        let respData = {
                            'trans_id': transId
                        };
                        tabtrans.tabtrans_id = transId;
                        tabtrans.no_rekening = params.no_rekening;
                        tabtrans.kode_kantor = params.kode_kantor;
                        tabtrans.kuitansi = params.kuitansi;
                        tabtrans.no_rekening_vs = params.no_rekening_vs;
                        tabtrans.user_id = params.user_id;
                        tabtrans.pokok = params.pokok;
                        tabtrans.tgl_trans = params.tgl_trans;
                        tabtrans.jam = params.jam;
                        tabtrans.ip_add = params.ip_add;
                        tabtrans.kode_trans = params.kode_trans;
                        tabtrans.keterangan = params.keterangan;
                        tabtrans.kuitansi_id = params.kuitansi_id;
                        tabtrans.sandi_trans = sandiTrans;
                        tabtrans.verifikasi = params.verifikasi;
                        tabtrans.kode_integrasi = params.kode_integrasi;
                        tabtrans.kode_integrasi_vs = params.kode_integrasi_vs;
                        tabtrans.kode_perk_ob = params.kode_perk_ob;
                        let result = crudtabung.AddTransTarikTabungan(tabtrans);
                        if (result) {
                            crudtabung.RepostingSaldoTabungan(params.no_rekening, params.tgl_trans);
                            responseBody = utility.GiveResponse("00", "TRANSAKSI TABUNGAN SUKSES", respData);
                        } else {
                            responseBody = utility.GiveResponse("01", "TRANSAKSI TABUNGAN GAGAL");
                            global_function.DeleteTrans('tabtrans', 'trans_id_source', transId);
                            global_function.DeleteTrans('transaksi_master', 'trans_id_source', transId);
                            global_function.DeleteTrans('tabtrans', 'tabtrans_id', transId);
                        }
                    }
                    global_function.InsertLogService(apicode.apiCodeTransTarikTabungan, params, responseBody, params.kode_kantor, params.user_id);
                    return res.send(responseBody);
                });
            connection.release();
        })
    },
    HandlerInquirySaldo: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        if (params.no_rekening === '' || !params.no_rekening) {
            return res.send(utility.GiveResponse("01", "NO REKENING HARUS DIISI"));
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.no_rekening);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "NO REKENING TABUNGAN TIDAK DITEMUKAN"));
        }
        if (params.kode_kantor === '' || !params.kode_kantor) {
            return res.send(utility.GiveResponse("01", "KODE KANTOR HARUS DIISI"));
        }
        if (params.user_id === '' || !params.user_id) {
            return res.send(utility.GiveResponse("01", "USER ID HARUS DIISI"));
        }
        let saldoAkhir = await crudtabung.GetSaldoAkhirTabungan(params.no_rekening, moment().format('YYYYMMDD'));
        pool.getConnection(function (err, connection) {
            let sqlString = `SELECT no_rekening,nama_nasabah FROM tabung
            LEFT JOIN nasabah ON tabung.nasabah_id = nasabah.nasabah_id WHERE tabung.kode_kantor = ?  AND (
            tabung.STATUS NOT IN ( 2 )) AND tabung.verifikasi > 0  AND no_rekening = ? LIMIT 1`;
            connection.query(sqlString,
                [params.kode_kantor, params.no_rekening], function (err, rows) {
                    if (err) {
                        console.error(`SELECT DATA ERROR: ${err.message}`);
                        responseBody = utility.GiveResponse("01", "INQUIRY SALDO TABUNGAN GAGAL");
                    } else {
                        let infoInquiry = {
                            no_rekening: rows[0].no_rekening,
                            nama_nasabah: rows[0].nama_nasabah,
                            saldo_akhir: saldoAkhir.toString()
                        };
                        responseBody = utility.GiveResponse("00", "INQUIRY SALDO TABUNGAN SUKSES", infoInquiry);
                    }
                    global_function.InsertLogService(apicode.apiCodeInquirySaldo, params, responseBody, params.kode_kantor, params.user_id);
                    return res.send(responseBody);
                });
            connection.release();
        });
    },
    HandlerInquiryRekening: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        if (params.no_rekening === '' || !params.no_rekening) {
            return res.send(utility.GiveResponse("01", "NO REKENING HARUS DIISI"));
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.no_rekening);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "NO REKENING TABUNGAN TIDAK DITEMUKAN"));
        }
        if (params.kode_kantor === '' || !params.kode_kantor) {
            return res.send(utility.GiveResponse("01", "KODE KANTOR HARUS DIISI"));
        }
        if (params.user_id === '' || !params.user_id) {
            return res.send(utility.GiveResponse("01", "USER ID HARUS DIISI"));
        }
        let saldoAkhir = await crudtabung.GetSaldoAkhirTabungan(params.no_rekening, moment().format('YYYYMMDD'));
        pool.getConnection(function (err, connection) {
            let sqlString = `SELECT no_rekening,nama_nasabah,nama_ibu_kandung,alamat,jenis_kelamin,
            tempatlahir,tgllahir,tabung.tgl_register,no_id,tabung.no_alternatif,
            tab_produk.kode_produk,tab_produk.deskripsi_produk FROM tabung
            LEFT JOIN nasabah ON tabung.nasabah_id = nasabah.nasabah_id 
            LEFT JOIN tab_produk ON tabung.kode_produk = tab_produk.kode_produk
            WHERE tabung.kode_kantor = ?  AND (
            tabung.STATUS NOT IN ( 2 )) AND tabung.verifikasi > 0  AND no_rekening = ? LIMIT 1`;
            connection.query(sqlString,
                [params.kode_kantor, params.no_rekening], function (err, rows) {
                    if (err) {
                        console.error(`SELECT DATA ERROR: ${err.message}`);
                        responseBody = utility.GiveResponse("01", "INQUIRY REKENING TABUNGAN GAGAL");
                    } else {
                        let infoInquiry = {
                            no_rekening: rows[0].no_rekening,
                            nama_nasabah: rows[0].nama_nasabah,
                            nama_ibu_kandung: rows[0].nama_ibu_kandung,
                            alamat: rows[0].alamat,
                            jenis_kelamin: rows[0].jenis_kelamin,
                            tempatlahir: rows[0].tempatlahir,
                            tgllahir: rows[0].tgllahir,
                            tgl_register: rows[0].tgl_register,
                            no_id: rows[0].no_id,
                            no_alternatif: rows[0].no_alternatif,
                            kode_produk: rows[0].kode_produk,
                            deskripsi_produk: rows[0].deskripsi_produk,
                            saldo_akhir: saldoAkhir.toString()
                        };
                        responseBody = utility.GiveResponse("00", "INQUIRY REKENING TABUNGAN SUKSES", infoInquiry);
                    }
                    global_function.InsertLogService(apicode.apiCodeInquirySaldo, params, responseBody, params.kode_kantor, params.user_id);
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
        if (params.kode_kantor === '' || !params.kode_kantor) {
            resperrParam += 'PARAMETER KODE KANTOR TIDAK ADA\n';
            errParam++;
        }
        if (params.user_id === '' || !params.user_id) {
            resperrParam += 'PARAMETER USER ID TIDAK ADA\n';
            errParam++;
        }
        // noinspection JSUnresolvedVariable
        if (params.tgl_awal === '' || !params.tgl_awal) {
            resperrParam += 'PARAMETER TGL AWAL TIDAK ADA\n';
            errParam++;
        }
        // noinspection JSUnresolvedVariable
        if (params.tgl_akhir === '' || !params.tgl_akhir) {
            resperrParam += 'PARAMETER TGL AKHIR TIDAK ADA\n';
            errParam++;
        }
        if (params.no_rekening === '' || !params.no_rekening) {
            resperrParam += 'PARAMETER NO REKENING TIDAK ADA\n';
            errParam++;
        }
        let existNoRekening = await global_function.GetValByKeyValString('no_rekening', 'tabung', 'no_rekening', params.no_rekening);
        if (existNoRekening === '') {
            return res.send(utility.GiveResponse("01", "NO REKENING TABUNGAN TIDAK DITEMUKAN"));
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse("00", resperrParam));
        }
        pool.getConnection(function (err, connection) {
            // noinspection JSUnresolvedVariable
            let sqlString = 'SET @saldoawal:=(SELECT COALESCE(SUM(IF(FLOOR(my_kode_trans/100)=1,pokok,0))-SUM(IF(FLOOR(my_kode_trans/100)=2,pokok,0)),0) ' +
                'FROM tabtrans WHERE tgl_trans< "' + params.tgl_awal + '" and no_rekening="' + params.no_rekening + '")';
            connection.query(sqlString, function (err) {
                if (err) {
                    console.error(`SET SALDO AWAL ERROR: ${err.message}`);
                    responseBody = utility.GiveResponse("01", "SET SALDO AWAL TABUNGAN GAGAL");
                    global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, responseBody, params.kode_kantor, params.user_id);
                    res.send(responseBody);
                } else {
                    connection.query(`SELECT @saldoawal AS saldo_awal`, function (err, rowSaldoAwal) {
                        if (err) {
                            console.error(`SET SALDO AWAL ERROR: ${err.message}`);
                            responseBody = utility.GiveResponse("01", "SELECT SALDO AWAL TABUNGAN GAGAL");
                            global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, responseBody, params.kode_kantor, params.user_id);
                            return res.send(responseBody);
                        } else {
                            sqlString = `SELECT tgl_trans,tt.no_rekening,tt.keterangan,kuitansi,my_kode_trans,tt.userid,
                        IF( floor( my_kode_trans / 100 )= 1, pokok, 0 ) setoran,IF ( floor( my_kode_trans / 100 )= 2, pokok, 0 ) penarikan,
                        @saldoawal := @saldoawal + IF( floor( my_kode_trans / 100 )= 1, pokok, 0 )- 
                        IF ( floor( my_kode_trans / 100 )= 2, pokok, 0 ) saldo_akhir FROM tabtrans tt, tabung t 
                        WHERE tt.no_rekening = t.no_rekening AND tt.kode_kantor = ? AND tgl_trans >= ? AND tgl_trans <= ? 
                        AND tt.no_rekening = ? ORDER BY tgl_trans,tabtrans_id`;
                            // noinspection JSUnresolvedVariable
                            connection.query(sqlString, [params.kode_kantor,
                                params.tgl_awal, params.tgl_akhir, params.no_rekening], function (err, rows) {
                                if (err) {
                                    console.error(`SELECT MUTASI SALDO ERROR: ${err.message}`);
                                    responseBody = utility.GiveResponse("01", "SELECT MUTASI TABUNGAN GAGAL");
                                    global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, responseBody, params.kode_kantor, params.user_id);
                                    return res.send(responseBody);
                                } else {
                                    responseBody = {
                                        response_code: "00",
                                        response_message: "GET MUTASI TABUNGAN SUKSES",
                                        saldo_awal: rowSaldoAwal[0].saldo_awal.toString(),
                                        response_data: rows
                                    };
                                    global_function.InsertLogService(apicode.apiCodeMutasiTabungan, params, JSON.stringify(responseBody), params.kode_kantor, params.user_id);
                                    return res.json(responseBody);
                                }
                            });
                        }
                    });
                }
            });
            connection.release();
        });
    }
};
