const utility = require('../helpers/utility');
const routes = require('express').Router();
const tabungan_controller = require('../controllers/tabungan_controller');
const reposting_jurnal_controller = require('../controllers/reposting_jurnal_controller');
const aba_controller = require('../controllers/aba_controller');
const global_controller = require('../controllers/global_controller');
const apicode = require('../constants/apicode');

// noinspection JSUnresolvedFunction
routes.get('/', (req, res) => {
    return res.send(utility.GiveResponse("00", process.env.APPNAME + " Version " + process.env.VERSION));
});

// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeTransTabungan + '', tabungan_controller.HandlerTransTabungan);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeInquirySaldo + '', tabungan_controller.HandlerInquirySaldo);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeInquiryRekening + '', tabungan_controller.HandlerInquiryRekening);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeMutasiTabungan + '', tabungan_controller.HandlerMutasiTabungan);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeTransABA + '', aba_controller.HandlerTransABA);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeGetKuitansi + '', global_controller.HandlerGetKuitansi);

// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeCekStatusTransaksi + '', global_controller.HandlerCekStatus);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeInquiryRepostingJurnal + '', reposting_jurnal_controller.HandlerInquiryRepostingJurnal);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeRepostingJurnal + '', reposting_jurnal_controller.HandlerRepostingJurnal);
// noinspection JSUnresolvedFunction
routes.post('/' + apicode.apiCodeGetTagihanTabProgram + '', tabungan_controller.HandlerGetTagihanTabProgram);
module.exports = routes;
