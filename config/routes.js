const utility = require('../helpers/utility');
const routes = require('express').Router();
const tabungan_controller = require('../controllers/tabungan_controller');
const global_controller = require('../controllers/global_controller');
const apicode = require('../constants/apicode');

// noinspection JSUnresolvedFunction
routes.get('/', (req, res) => {
    return res.send(utility.GiveResponse("00", process.env.APPNAME + " Version " + process.env.VERSION));
});

// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeTransTarikTabungan + '', tabungan_controller.HandlerTransTarikTabungan);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeInquirySaldo + '', tabungan_controller.HandlerInquirySaldo);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeInquiryRekening + '', tabungan_controller.HandlerInquiryRekening);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeMutasiTabungan + '', tabungan_controller.HandlerMutasiTabungan);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeGetKuitansi + '', global_controller.HandlerGetKuitansi);
module.exports = routes;
