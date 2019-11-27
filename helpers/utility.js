const moment = require('moment');
const uuid = require('node-uuid');
const crypto = require('crypto');

module.exports = {
    /**
     * @return {string}
     */
    GiveResponse: function (response_code, response_message, response_data = "") {
        return JSON.stringify({
            response_code,
            response_message,
            response_data
        });
    },
    /**
     * @return {string}
     */
    KuitansiClient: function (setting, kode_kantor, number) {
        let strKuitansi = "";
        let day = moment().format('DD');
        let month = moment().format('MM');
        let year = moment().format('YYYY');
        if (setting !== '') {
            strKuitansi = setting;
            strKuitansi = strKuitansi.replace('###', kode_kantor);
            strKuitansi = strKuitansi.replace('&&', day);
            strKuitansi = strKuitansi.replace('@@', month);
            strKuitansi = strKuitansi.replace('%%', year);
            strKuitansi = strKuitansi.replace('[99999]', number);
        }
        return strKuitansi;
    },
    AssignId: function (req, res, next) {
        req.id = uuid.v4();
        next()
    },
    /**
     * @return {string}
     */
    EncodeSHA1: function (word) {
        let shasum = crypto.createHash('sha1');
        shasum.update('' + word + '');
        return shasum.digest('hex');
    },
    /**
     * @return {string}
     */
    GenerateVA: function () {
        return Math.random().toString(36).substr(2, 5);
    }
};
