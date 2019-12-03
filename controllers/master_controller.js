const pool_promisify = require('../config/pooling_promisify');
const utility = require("../helpers/utility");
const global_function = require('../helpers/global_function');
const apicode = require('../constants/apicode');
const moment = require('moment');

module.exports = {
    HandlerRegistrasiNasabah: async function (req, res) {
        let params = req.body;
        let responseBody = "";
        let resperrParam = '';
        let errParam = 0;
        if (params.client_id === '' || !params.client_id) {
            resperrParam += 'MISSING CLIENT ID PARAMETER\n';
            errParam++;
        }
        if (params.customer_name === '' || !params.customer_name) {
            resperrParam += 'MISSING CUSTOMER NAME PARAMETER\n';
            errParam++;
        }
        if (params.place_of_birth === '' || !params.place_of_birth) {
            resperrParam += 'MISSING PLACE OF BIRTH PARAMETER\n';
            errParam++;
        }
        if (params.date_of_birth === '' || !params.date_of_birth) {
            resperrParam += 'MISSING DATE OF BIRTH PARAMETER\n';
            errParam++;
        }
        if (params.gender === '' || !params.gender) {
            resperrParam += 'MISSING GENDER PARAMETER\n';
            errParam++;
        }
        if (params.religion === '' || !params.religion) {
            resperrParam += 'MISSING RELIGION PARAMETER\n';
            errParam++;
        }
        if (params.address === '' || !params.address) {
            resperrParam += 'MISSING ADDRESS PARAMETER\n';
            errParam++;
        }
        if (params.city === '' || !params.city) {
            resperrParam += 'MISSING CITY PARAMETER\n';
            errParam++;
        }
        if (params.phone === '' || !params.phone) {
            resperrParam += 'MISSING PHONE PARAMETER\n';
            errParam++;
        }
        if (params.mothers_name === '' || !params.mothers_name) {
            resperrParam += 'MISSING MOTHERS NAME PARAMETER\n';
            errParam++;
        }
        if (params.username === '' || !params.username) {
            resperrParam += 'MISSING USERNAME PARAMETER\n';
            errParam++;
        }
        if (params.password === '' || !params.password) {
            resperrParam += 'MISSING PASSWORD PARAMETER\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }

        let nasabah_id = await global_function.GenerateNasabahId();
        if (nasabah_id === '0') {
            return res.send(utility.GiveResponse('00', "FAILED GENERATE CUSTOMER ID"));
        }
        try {
            let tgl_register = moment().format('YYYY-MM-DD');
            let sqlString = `INSERT INTO nasabah (nasabah_id,tgl_register, nama_nasabah, tempatlahir, tgllahir,
                jenis_kelamin, kode_agama, alamat, kota_kab, telpon,nama_ibu_kandung, username,password) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            let result = await pool_promisify.query(sqlString, [nasabah_id,tgl_register, params.customer_name, params.place_of_birth, params.date_of_birth,
                params.gender, params.religion, params.address, params.city, params.phone, params.mothers_name,
                params.username, utility.EncodeSHA1(params.password)]);
            if (result) {
                let defaultProduct = await global_function.GetCountCoreProduct();
                let errors = 0;
                for (const element of defaultProduct) {
                    let minimum = 0;
                    let setoran_minimum = 0;
                    let setoran_per_bln = 0;
                    let periode_setoran = 0;
                    let satuan_waktu_setoran = '';
                    let tgl_jt = '';
                    let jkw = 0;
                    let setoran_awal = 0;
                    if (element.jenis === '10') {
                        minimum = element.saldo_minimum_default;
                        setoran_minimum = element.setoran_minimum_default;
                        tgl_jt = null;
                    } else {
                        setoran_per_bln = '10000';
                        periode_setoran = '1';
                        satuan_waktu_setoran = 'B';
                        tgl_jt = moment().add(12, 'months').format('YYYY-MM-DD');
                        jkw = '12';
                        setoran_awal = element.setoran_pertama;
                    }
                    sqlString = `INSERT INTO tabung(no_rekening,nasabah_id,tgl_register,verifikasi,status,
                        kode_kantor,kode_integrasi,kode_produk,kode_jenis,no_rekening_virtual,minimum,setoran_minimum,
                        setoran_per_bln,periode_setoran,satuan_waktu_setoran,tgl_jt,jkw,setoran_awal,
                        suku_bunga,persen_pph,keterangan,userid,norek_tab_program)
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                    let norek = await global_function.GenerateNoRekening(params.client_id, element.kode_produk);
                    let insertTabung = await pool_promisify.query(sqlString, [norek, nasabah_id, tgl_register, '1', '1',
                        params.client_id, element.kode_produk, element.kode_produk,
                        element.jenis, utility.GenerateVA(), minimum, setoran_minimum,
                        setoran_per_bln, periode_setoran, satuan_waktu_setoran, tgl_jt, jkw, setoran_awal,
                        element.suku_bunga_default, element.pph_default, 'Hasil Generate System', process.env.APIUSERID, '']);
                    if (!insertTabung) {
                        errors++;
                    }
                }
                if (errors === 0) {
                    let respData = [{
                        'customer_id': nasabah_id
                    }];
                    let tab_kode_produk_tab_utama = await global_function.GetSysMySysIdValue('TAB_KODE_PRODUK_TABUNGAN_UTAMA');
                    sqlString = `SELECT no_rekening FROM tabung WHERE kode_produk = ? AND nasabah_id = ?`;
                    let resultGetTabUmum = await pool_promisify.query(sqlString, [tab_kode_produk_tab_utama, nasabah_id]);
                    let norek_tab_program = resultGetTabUmum[0].no_rekening;
                    sqlString = `UPDATE tabung set norek_tab_program=? WHERE nasabah_id=? AND kode_jenis='20'`;
                    await pool_promisify.query(sqlString, [norek_tab_program, nasabah_id]);
                    responseBody = utility.GiveResponse('00', "SUCCESSFULLY REGISTRATION", respData);
                } else {
                    global_function.DeleteTrans('tabung', 'nasabah_id', nasabah_id);
                    global_function.DeleteTrans('nasabah', 'nasabah_id', nasabah_id);
                    responseBody = utility.GiveResponse('01', "FAILED REGISTRATION,CREATE ACCOUNT FAILED");
                }
            } else {
                responseBody = utility.GiveResponse('00', "FAILED REGISTRATION,CREATE CUSTOMER FAILED");
            }
            global_function.InsertLogService(apicode.apiCodeRegistrasiNasabah, params, responseBody, params.client_id, process.env.APIUSERID);
            return res.send(responseBody);
        } catch (err) {
            global_function.DeleteTrans('tabung', 'nasabah_id', nasabah_id);
            global_function.DeleteTrans('nasabah', 'nasabah_id', nasabah_id);
            return res.send(utility.GiveResponse('00', "FAILED REGISTRATION,CREATE CUSTOMER FAILED", err.message))
        }
    }
};
