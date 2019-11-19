const utility = require("../helpers/utility");
const jwt = require('jsonwebtoken');

module.exports = {
    MiddlewareVerifyJWTToken: function (req, res, next) {
        let token = '';
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        module.exports.VerifyJWTToken(token).then((decodeToken) => {
            req.user = decodeToken.data;
            next();
        }).catch((err) => {
            return res.send(utility.GiveResponse("01", "INVALID AUTH TOKEN PROVIDED. [" + err.message.toUpperCase() + "]"));
        })
    },
    VerifyJWTToken: function (token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
                if (err || !decodedToken) {
                    return reject(err)
                }
                resolve(decodedToken)
            })
        });
    }
};
