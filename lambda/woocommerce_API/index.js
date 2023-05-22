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
var axios_1 = require("axios");
var client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
function axiosError(error) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }
            else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            }
            else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
            console.log(error.config);
            return [2 /*return*/];
        });
    });
}
;
exports.handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var secret_name, client, response_1, error_1, secret, username, password, authToken, postData, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                secret_name = process.env.SECRET_NAME;
                client = new client_secrets_manager_1.SecretsManagerClient({
                    region: process.env.REGION
                });
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, client.send(new client_secrets_manager_1.GetSecretValueCommand({
                        SecretId: secret_name,
                        VersionStage: "AWSCURRENT"
                    }))];
            case 2:
                response_1 = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                // For a list of exceptions thrown, see
                // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
                throw error_1;
            case 4:
                secret = response_1.SecretString;
                username = JSON.parse(secret).username;
                password = JSON.parse(secret).password;
                return [4 /*yield*/, axios_1["default"].get("http://109.123.241.212/auth/login?username=" + username + "&password=" + password)
                        .then(function (tokenResponse) {
                        response_1 = tokenResponse;
                    })["catch"](function (error) {
                        axiosError(error);
                    })];
            case 5:
                _b.sent();
                authToken = response_1.data.access_token;
                postData = [event];
                console.log('postData: ', postData);
                // // Effettua la richiesta POST utilizzando i dati e l'header appena creati
                return [4 /*yield*/, axios_1["default"].post('http://109.123.241.212/api/products/new/', postData, {
                        headers: {
                            'Authorization': "Bearer " + authToken,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(function (postResponse) {
                        console.log(postResponse);
                    })["catch"](function (error) {
                        axiosError(error);
                    })];
            case 6:
                // // Effettua la richiesta POST utilizzando i dati e l'header appena creati
                _b.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify('OK')
                    }];
            case 7:
                error_2 = _b.sent();
                console.error(error_2);
                return [2 /*return*/, {
                        statusCode: ((_a = error_2.response) === null || _a === void 0 ? void 0 : _a.status) || 500,
                        body: JSON.stringify({ message: error_2.message })
                    }];
            case 8: return [2 /*return*/];
        }
    });
}); };
