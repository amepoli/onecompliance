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
var Pool = require("pg-pool");
AWS.config.update({ region: process.env.REGION });
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
var dynamo = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var pool = new Pool({
    host: process.env.HOST_NAME,
    database: process.env.DB_NAME,
    user: process.env.USER_NAME,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});
exports.handler = function () { return __awaiter(void 0, void 0, void 0, function () {
    var queryResult, bodyResponse, d, today, nextYearFromToday, users_table, users_json, query;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                bodyResponse = { result: 'Ok', reason: null, response: [] };
                d = new Date();
                today = d.toISOString();
                d.setFullYear(d.getFullYear() + 1);
                nextYearFromToday = d.toISOString();
                return [4 /*yield*/, dynamo.scan({
                        TableName: 'users',
                        ProjectionExpression: "userid,companies,createdAt,email,#dynobase_language,lastname,#dynobase_name,onekyc,picture,showTimeTracker,sync,username",
                        ExpressionAttributeNames: { "#dynobase_name": "name", "#dynobase_language": "language" }
                    }).promise()];
            case 1:
                users_table = _a.sent();
                users_json = JSON.stringify(users_table.Items);
                query = "SELECT entrasp.dynamodb_users_insert($$" + users_json + "$$::json);";
                return [4 /*yield*/, pool
                        .query(query)
                        .then(function (res) { return queryResult = res.rows.length > 0 ? res : null; })["catch"](function (err) {
                        console.error("Error executing query \"" + query + "\"", err.stack);
                        bodyResponse = { result: 'KO', reason: 'Something went wrong quering the DB', response: null };
                    })];
            case 2:
                _a.sent();
                if (queryResult) {
                }
                // console.log('bodyResponse: ', JSON.stringify(bodyResponse));
                return [2 /*return*/, {
                        isBase64Encoded: false,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                        statusCode: 200,
                        body: JSON.stringify(bodyResponse)
                    }];
        }
    });
}); };
