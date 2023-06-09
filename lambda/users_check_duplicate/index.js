"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
var dynamo = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var ses = new AWS.SES({ apiVersion: '2010-12-01' });
// const pool = new Pool({
//     host: process.env.HOST_NAME,
//     database: process.env.DB_NAME,
//     user: process.env.USER_NAME,
//     password: process.env.PASSWORD,
//     port: process.env.PORT,
//     max: 1,
//     min: 0,
//     idleTimeoutMillis: 300000,
//     connectionTimeoutMillis: 1000
// });
function sendEmail(to, body, subject) {
    return __awaiter(this, void 0, void 0, function () {
        var eParams, email;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    eParams = {
                        Destination: {
                            ToAddresses: to
                        },
                        Message: {
                            Body: {
                                Text: {
                                    Charset: "UTF-8",
                                    Data: body
                                }
                            },
                            Subject: {
                                Charset: "UTF-8",
                                Data: subject
                            }
                        },
                        // Replace source_email with your SES validated email address
                        Source: 'service@alacritas.eu'
                    };
                    return [4 /*yield*/, ses.sendEmail(eParams).promise()];
                case 1:
                    email = _a.sent();
                    console.log('Sent email: ', eParams);
                    return [2 /*return*/];
            }
        });
    });
}
exports.handler = function () { return __awaiter(void 0, void 0, void 0, function () {
    var bodyResponse, users_table, bodyEmail, send, i, j, k, l;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    return __generator(this, function (_p) {
        switch (_p.label) {
            case 0:
                bodyResponse = { result: 'Ok', reason: null, response: [] };
                return [4 /*yield*/, dynamo.scan({
                        TableName: 'USERS_NAME',
                        ProjectionExpression: "userid,companies,createdAt,email,#dynobase_language,lastname,#dynobase_name,onekyc,picture,showTimeTracker,sync,username",
                        ExpressionAttributeNames: { "#dynobase_name": "name", "#dynobase_language": "language" }
                    }).promise()];
            case 1:
                users_table = _p.sent();
                bodyEmail = 'Sono stati riscontrati i seguenti conflitti anagrafici tra differenti user: \n';
                send = false;
                for (i = 0; i < users_table.Items.length - 1; i++) {
                    for (j = 0; j < users_table.Items[i].companies.L.length; j++) {
                        for (k = i + 1; k < users_table.Items.length; k++) {
                            for (l = 0; l < users_table.Items[k].companies.L.length; l++) {
                                if (((_c = (_b = (_a = users_table.Items[i].companies.L[j]) === null || _a === void 0 ? void 0 : _a.M) === null || _b === void 0 ? void 0 : _b.id_anagrafica) === null || _c === void 0 ? void 0 : _c.N) &&
                                    ((_f = (_e = (_d = users_table.Items[i].companies.L[j]) === null || _d === void 0 ? void 0 : _d.M) === null || _e === void 0 ? void 0 : _e.id_anagrafica) === null || _f === void 0 ? void 0 : _f.N) == ((_j = (_h = (_g = users_table.Items[k].companies.L[l]) === null || _g === void 0 ? void 0 : _g.M) === null || _h === void 0 ? void 0 : _h.id_anagrafica) === null || _j === void 0 ? void 0 : _j.N)
                                    && ((_l = (_k = users_table.Items[i].companies.L[j].M) === null || _k === void 0 ? void 0 : _k.name) === null || _l === void 0 ? void 0 : _l.S) == ((_o = (_m = users_table.Items[k].companies.L[l].M) === null || _m === void 0 ? void 0 : _m.name) === null || _o === void 0 ? void 0 : _o.S)) {
                                    send = true;
                                    bodyEmail = bodyEmail + ' - anagrafiche uguali su ' + users_table.Items[i].companies.L[j].M.name.S + ' per gli utenti ' + users_table.Items[i].username.S + ' e ' + users_table.Items[k].username.S + '\n';
                                }
                            }
                        }
                    }
                }
                if (!send) return [3 /*break*/, 3];
                return [4 /*yield*/, sendEmail(['service@alacritas.eu', 'info@alacritas.eu'], bodyEmail, 'Conflitti di "id_anagrafica" tra users')];
            case 2:
                _p.sent();
                _p.label = 3;
            case 3: return [2 /*return*/, {
                    isBase64Encoded: false,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    statusCode: 200,
                    body: JSON.stringify(bodyResponse)
                }];
        }
    });
}); };
