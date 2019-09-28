const utility = require("../helpers/utility");
const global_function = require('../helpers/global_function');
const pool = require('../config/pooling');
const apicode = require('../constants/apicode');

module.exports = {
    HandlerGetKuitansi: async function (req, res) {
        let params = req.body;
        let responseBody = "";
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
        if (params.tgl_trans === '' || !params.tgl_trans) {
            resperrParam += 'PARAMETER TGL TRANS TIDAK ADA\n';
            errParam++;
        }
        if (errParam > 0) {
            return res.send(utility.GiveResponse('00', resperrParam));
        }
        let kuitansi = "";
        let setting = await global_function.GetSysMySysIdValue('APP_TEMPLATE_NO_KUITANSI');
        pool.getConnection(function (err, connection) {
            let sqlString = 'SELECT GENERATE_KUITANSI(' + params.kode_kantor + ',' + params.user_id + ',' + params.tgl_trans + ') kuitansi ';
            connection.query(sqlString, function (err, rows) {
                if (err) {
                    console.error(`GET FUNC KUITANSI GAGAL : ${err.message}`);
                    responseBody = utility.GiveResponse("01", "GET KUITANSI GAGAL");
                    global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.kode_kantor, params.user_id);
                    return res.send(responseBody);
                } else {
                    kuitansi = rows[0].kuitansi;
                    sqlString = 'SELECT GENERATE_KUITANSI_CLIENT(' + params.kode_kantor + ',' + params.tgl_trans + ') no_kuitansi_client';
                    connection.query(sqlString, function (err, rows) {
                        if (err) {
                            console.error(`GET FUNC KUITANSI CLIENT GAGAL : ${err.message}`);
                            responseBody = utility.GiveResponse("01", "GET KUITANSI CLIENT GAGAL");
                            global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.kode_kantor, params.user_id);
                            return res.send(responseBody);
                        } else {
                            // noinspection JSUnresolvedVariable
                            let kuitansiClient = rows[0].no_kuitansi_client;
                            let respKuintasi = {
                                "no_kuitansi_client": utility.KuitansiClient(setting, params.kode_kantor, kuitansiClient),
                                "no_kuitansi": kuitansi
                            };
                            responseBody = utility.GiveResponse("00", "GET KUITANSI SUKSES", respKuintasi);
                            global_function.InsertLogService(apicode.apiCodeGetKuitansi, params, responseBody, params.kode_kantor, params.user_id);
                            return res.send(responseBody);
                        }
                    });
                }
            });
            connection.release();
        });
    }
};