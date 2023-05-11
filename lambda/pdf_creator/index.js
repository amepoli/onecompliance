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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var AWS = require("aws-sdk");
// import * as Pool from 'pg-pool';
var puppeteer_core_1 = require("puppeteer-core");
var chromium = require("@sparticuz/chromium");
AWS.config.update({ region: process.env.REGION });
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
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
var default_separator_out = ';';
var default_bucket_name = 'BUCKET_NAME';
var default_company = 'DEMO';
var default_folder = 'test';
var default_file_out = 'test_csv_creator.csv';
var default_query = 'SELECT 1 AS one,2 AS two,3 AS three';
var csvFile = '';
exports.handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    function getTemplateFromS3(key) {
        return __awaiter(this, void 0, void 0, function () {
            var params, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = {
                            Bucket: "nome-bucket-s3",
                            Key: key
                        };
                        return [4 /*yield*/, s3.getObject(params).promise()];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data.Body.toString()];
                }
            });
        });
    }
    function savePdfToS3(pdfBuffer, key) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = {
                            Bucket: process.env.BUCKET_NAME,
                            Key: key,
                            Body: pdfBuffer,
                            ContentType: "application/pdf"
                        };
                        return [4 /*yield*/, s3.putObject(params).promise()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    var queryParams, body, template, browser, _a, _b, _c, page, pdfBuffer;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                queryParams = event.queryStringParameters ? event.queryStringParameters : event;
                console.log(queryParams);
                body = { result: 'OK' };
                template = "\n    <!DOCTYPE html>\n<html>\n\n<head>\n    <meta charset=\"utf-8\">\n    <title>Questionario</title>\n    <style>header {\n        background-color: #007bff;\n        padding: 10px 20px;\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n      }\n      \n      header img {\n        height: 50px;\n      }\n      \n      header a {\n        text-decoration: none;\n        color: #fff;\n        font-size: 20px;\n      }\n      \n      body {\n        font-family: Arial, sans-serif;\n        font-size: 12px;\n        line-height: 1.5;\n        color: #333;\n        margin: 0;\n        padding: 0;\n      }\n      \n      h1 {\n        font-size: 18px;\n        margin-bottom: 20px;\n        text-align: center;\n      }\n      \n      .question-container {\n        width: 80%;\n        margin: auto;\n      }\n      \n      .question-box {\n        margin-bottom: 20px;\n        border: 1px solid #c7c7c7;\n        border-radius: 10px;\n        padding: 20px;\n        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);\n        background-color: #f7f7f7;\n      }\n      \n      .question-box label {\n        display: block;\n        margin-bottom: 10px;\n      }\n      \n      .question-box input[type=\"radio\"],\n      .question-box input[type=\"checkbox\"] {\n        margin-right: 10px;\n      }\n      \n      button {\n        display: block;\n        margin-top: 20px;\n        padding: 10px 20px;\n        font-size: 14px;\n        font-weight: bold;\n        text-transform: uppercase;\n        color: #fff;\n        background-color: #007bff;\n        border: none;\n        border-radius: 5px;\n        cursor: pointer;\n      }\n      \n      .barra {\n        background: linear-gradient(to right, #00ff00, #ffff00, #ffa500, #ff0000);\n        height: 30px;\n        border-radius: 10px;\n        margin-bottom: 10px;\n        position: relative;\n      }\n      \n      .sezione {\n        height: 100%;\n        position: absolute;\n        top: 0;\n      }\n      \n      .verde {\n        width: 20%;\n      }\n      \n      .giallo-chiaro {\n        width: 20%;\n        left: 20%;\n      }\n      \n      .giallo {\n        width: 20%;\n        left: 40%;\n      }\n      \n      .arancione {\n        width: 20%;\n        left: 60%;\n      }\n      \n      .rosso {\n        width: 20%;\n        left: 80%;\n      }\n      \n      .descrizione {\n        display: block;\n        text-align: center;\n        margin-top: -20px;\n        font-size: 12px;\n      }\n      \n      .punteggio {\n        display: block;\n        text-align: center;\n        font-size: 12px;\n        margin-top: 10px;\n      }\n      \n      .massimo-punteggio {\n        position: absolute;\n        bottom: -25px;\n        right: 0;\n        font-size: 14px;\n      }</style>\n</head>\n\n<body>\n    <header>\n        <img src=\"https://auditft.it/wp-content/uploads/2020/10/auditft-logo.png\" alt=\"Audit Financial Team Srl\"\n            href=\"https://auditft.it\">\n    </header>\n    <h1>Profilazione AML</h1>\n    <div class=\"question-container\">\n        <section></br>\n            <h3>In questo questionario ti chiediamo di rispondere ad alcune domande riguardanti il tuo cliente\n                e le sue attivit\u00E0 in modo da poter creare un profilo di rischio riciclaggio.</h3></br>\n            \n            <h4>Sulla base di punti ottenuti il rischio associato al cliente sar\u00E0 il seguente:</h4></br>\n            <div class=\"barra\">\n                <div class=\"sezione verde\" title=\"Basso\">\n                    <span class=\"descrizione\">Basso</span>\n                    <span class=\"punteggio\">0-5</span>\n                </div>\n                <div class=\"sezione giallo-chiaro\" title=\"Medio-basso\">\n                    <span class=\"descrizione\">Medio-basso</span>\n                    <span class=\"punteggio\">6-10</span>\n                </div>\n                <div class=\"sezione giallo\" title=\"Medio\">\n                    <span class=\"descrizione\">Medio</span>\n                    <span class=\"punteggio\">11-15</span>\n                </div>\n                <div class=\"sezione arancione\" title=\"Medio-alto\">\n                    <span class=\"descrizione\">Medio-alto</span>\n                    <span class=\"punteggio\">16-19</span>\n                </div>\n                <div class=\"sezione rosso\" title=\"Alto\">\n                    <span class=\"descrizione\">Alto</span>\n                    <span class=\"punteggio\">20</span>\n                </div>\n                <div class=\"massimo-punteggio\">\n                    Massimo punteggio ottenibile: 20\n                </div>\n            </div></br>\n\n\n        </section>\n\n        <section class=\"question-box\">\n            <h2>Appartiene a qualche blacklist europea? <small>(liste come adf,ljkh,mbv)</small></h2>\n            <label><input type=\"radio\" name=\"domanda1\" value=\"opzione1\"> No (0 pt.)</label>\n            <label><input type=\"radio\" name=\"domanda1\" value=\"opzione2\"> Non so (5 pt.)</label>\n            <label><input type=\"radio\" name=\"domanda1\" value=\"opzione3\"> S\u00EC (10 pt.)</label>\n        </section>\n\n        <section class=\"question-box\">\n            <h2>La sua attivit\u00E0 opera in una provincia a rischio?</h2>\n            <label><input type=\"radio\" name=\"domanda2\" value=\"opzione1\"> Si (5 pt.)</label>\n            <label><input type=\"radio\" name=\"domanda2\" value=\"opzione2\"> No (0 pt.)</label>\n        </section>\n\n        <section class=\"question-box\">\n            <h2>Quali tra i seguenti?</h2>\n            <label><input type=\"checkbox\" name=\"domanda3-opzione1\" value=\"opzione1\"> Opzione 1 (2 pt.)</label>\n            <label><input type=\"checkbox\" name=\"domanda3-opzione2\" value=\"opzione2\"> Opzione 2 (2 pt.)</label>\n            <label><input type=\"checkbox\" name=\"domanda3-opzione3\" value=\"opzione3\"> Opzione 3 (1 pt.)</label>\n        </section>\n    </div>\n</body>\n\n</html>\n    ";
                _b = (_a = puppeteer_core_1["default"]).launch;
                _c = {};
                return [4 /*yield*/, chromium.executablePath()];
            case 1: return [4 /*yield*/, _b.apply(_a, [(_c.executablePath = _d.sent(),
                        _c.headless = chromium.headless,
                        _c.ignoreHTTPSErrors = true,
                        _c.defaultViewport = chromium.defaultViewport,
                        _c.args = __spreadArrays(chromium.args, ["--hide-scrollbars", "--disable-web-security"]),
                        _c)])];
            case 2:
                browser = _d.sent();
                return [4 /*yield*/, browser.newPage()];
            case 3:
                page = _d.sent();
                return [4 /*yield*/, page.setContent(template, { waitUntil: 'domcontentloaded' })];
            case 4:
                _d.sent();
                // To reflect CSS used for screens instead of print
                return [4 /*yield*/, page.emulateMediaType('screen')];
            case 5:
                // To reflect CSS used for screens instead of print
                _d.sent();
                return [4 /*yield*/, page.pdf({
                        path: 'result.pdf',
                        margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
                        printBackground: true,
                        format: 'A4'
                    })];
            case 6:
                pdfBuffer = _d.sent();
                // Salva il PDF su S3
                return [4 /*yield*/, savePdfToS3(pdfBuffer, "puppeteer.pdf")];
            case 7:
                // Salva il PDF su S3
                _d.sent();
                // Chiudi il browser Puppeteer
                return [4 /*yield*/, browser.close()];
            case 8:
                // Chiudi il browser Puppeteer
                _d.sent();
                console.log("PDF creato e salvato su S3 con successo!");
                ;
                ;
                return [2 /*return*/, {
                        "isBase64Encoded": false,
                        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                        "statusCode": 200,
                        "body": JSON.stringify(body)
                    }];
        }
    });
}); };
