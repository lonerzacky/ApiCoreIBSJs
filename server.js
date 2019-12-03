require('dotenv').config();
require('express-group-routes');
import utility from 'helpers/utility';
import conn from 'config/connection';
import morganBody from 'morgan-body';
import bodyParser from 'body-parser';
import security from 'middlewares/security';
// noinspection ES6ConvertRequireIntoImport,JSFileReferences
const global_controller = require('../controllers/global_controller');
// noinspection ES6ConvertRequireIntoImport,JSFileReferences
const tabungan_controller = require('../controllers/tabungan_controller');
// noinspection ES6ConvertRequireIntoImport,JSFileReferences
const master_controller = require('../controllers/master_controller');
// noinspection JSFileReferences
const apicode = require('../constants/apicode');
const morgan = require('morgan');
const express = require('express');
const app = express();
// noinspection NpmUsedModulesInstalled
const routes = require('config/routes');
// noinspection DuplicatedCode
conn.connect((err) => {
    if (err) {
        console.log('Connection to ' + process.env.DBHOSTNAME + ':' + process.env.DATABASEPORT + ' Failed : ' + err);
        process.exit();
    }
    console.log('Connection to ' + process.env.DBHOSTNAME + ':' + process.env.DATABASEPORT + ' Established')
});

conn.end((err) => {
    if (err) {
        console.log(err);
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
morgan.token('id', function getId(req) {
    return req.id
});
app.use(utility.AssignId);

// noinspection JSUnresolvedFunction
app.group('/api/' + process.env.PREFIXVER + '', (router) => {
    morganBody(app);
    // noinspection JSUnresolvedFunction
    router.post('/' + apicode.apiCodeLoginApp + '', global_controller.HandlerLoginApp);
    // noinspection JSUnresolvedFunction
    router.post('/' + apicode.apiCodeLoginMobileApp + '', global_controller.HandlerLoginMobileApp);
    // noinspection JSUnresolvedFunction
    router.post('/' + apicode.apiCodeRegistrasiNasabah + '', master_controller.HandlerRegistrasiNasabah);
    // noinspection JSUnresolvedFunction
    router.post('/' + apicode.apiCodeCekStatusBatchNasabah + '', master_controller.HandlerCekStatusBatchNasabah);
    // noinspection JSUnresolvedFunction
    router.post('/' + apicode.apiCodeForwardingPayment + '', tabungan_controller.HandlerForwardingPayment);
    router.all('*', security.MiddlewareVerifyJWTToken);
    router.use('/', routes);
});

// all other requests redirect to 404
app.all("*", function (req, res) {
    return res.send(utility.GiveResponse('01', 'METHOD NOT ALLOWED'));
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Server running at http://' + process.env.HOSTNAME + ':' + process.env.PORT + '')
});

