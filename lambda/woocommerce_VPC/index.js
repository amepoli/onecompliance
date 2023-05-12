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
var excel = require("node-excel-export");
var AWS = require("aws-sdk");
var Pool = require("pg-pool");
AWS.config.update({ region: process.env.REGION });
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
var lambda = new AWS.Lambda({ region: process.env.REGION });
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
function dataPrepare2xls(dataset, title) {
    var styles = {
        headerDark: {
            fill: {
                fgColor: {
                    rgb: 'FF008000'
                }
            },
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 18,
                bold: true
            }
        },
        title: {
            fill: {
                fgColor: {
                    rgb: 'FF2B679D'
                }
            },
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 34,
                bold: true
            }
        },
        data: {
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 16,
                bold: true
            },
            fill: {
                fgColor: {
                    rgb: 'FF16ACFF'
                }
            }
        },
        cellRed: {
            fill: {
                fgColor: {
                    rgb: 'FFFF0000'
                }
            }
        },
        cellUnderlined: {
            font: {
                color: {
                    rgb: 'FF0645AD'
                },
                underline: true
            }
        }
    };
    //Array of objects representing heading rows (very top)
    var heading = [
        [{
                value: title,
                style: styles.title
            }] // <-- It can be only values
    ];
    //console.log('generate secondary sheets with dataset: ', dataset);
    var specification = {};
    var property = Object.keys(dataset.rows[0]);
    for (var i = 0; i < property.length; i++) {
        specification[property[i]] = {
            displayName: property[i],
            headerStyle: styles.data,
            width: 120
        };
    }
    var merges = [{
            start: {
                row: 1,
                column: 1
            },
            end: {
                row: 1,
                column: property.length
            }
        }];
    return {
        name: title,
        heading: heading,
        merges: merges,
        specification: specification,
        data: dataset.rows // <-- Report data
    };
}
exports.handler = function () { return __awaiter(void 0, void 0, void 0, function () {
    var queryResult, bodyResponse, d, today, nextYearFromToday, query, _loop_1, filename, s3ParamsInsert, s3ParamsUrl, _a, _b, _i, row;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                bodyResponse = { result: 'Ok', reason: null, response: [] };
                d = new Date();
                today = d.toISOString();
                d.setFullYear(d.getFullYear() + 1);
                nextYearFromToday = d.toISOString();
                query = "SELECT 'select coalesce(id_sezione,1) as sezione, (select descrizione from entrasp.domande_sezioni where id_modello_test=domande.id_modello_test and id_modello_test_vr=domande.id_modello_test_vr and codice_azienda=domande.codice_azienda and id_sezione=domande.id_sezione ) as descrizione_sezione, ordinamento, descrizione as domanda, punteggio as punteggio_domanda, note as note_domanda, entrasp.risposte_previste_mostra1(codice_azienda, id_modello_test, id_modello_test_vr, id_domanda) as risposte_previste from entrasp.domande where codice_azienda=''SITO'' and id_modello_test='||mt.id_modello_test||' and id_modello_test_vr='||mtvr.id_modello_test_vr||' order by id_sezione asc, ordinamento asc' query_excel_to_create,\n                    mt.id_modello_test,\n                    mtvr.id_modello_test_vr,\n                    mt.titolo AS name,\n                    concat_ws('.',mt.id_modello_test,mtvr.id_modello_test_vr,mt.codice) AS sku,\n                    concat_ws('.',mt.id_modello_test,mtvr.id_modello_test_vr,mt.codice) AS partnersku,\n                    '0' AS ean,\n                    mt.descrizione AS description,\n                    mt.titolo AS shortdescription,\n                    mt.descrizione AS descriptionit,\n                    mt.descrizione AS descriptionen,\n                    CURRENT_TIMESTAMP AS dateonsalefrom,\n                    CURRENT_TIMESTAMP+interval '1 year' AS dateonsaleto,\n                    '999' AS stock,\n                    '49.99' AS price,\n                    NULL AS downloads,\n                    '-1' AS downloadlimit,\n                    '-1' AS downloadexpiry\n                FROM entrasp.modelli_test mt\n                INNER JOIN entrasp.modelli_test_vr mtvr\n                    ON mt.codice_azienda=mtvr.codice_azienda\n                    AND mt.id_modello_test=mtvr.id_modello_test\n                WHERE mtvr.id_modello_test_vr=entrasp.grc_max_id_mdt_vr(mt.codice_azienda, mt.id_modello_test)\n                    AND mt.codice_azienda='SITO'\n                    --AND mtvr.data_ins::date = CURRENT_DATE;";
                return [4 /*yield*/, pool
                        .query(query)
                        .then(function (res) { return queryResult = res.rows.length > 0 ? res : null; })["catch"](function (err) {
                        console.error("Error executing query \"" + query + "\"", err.stack);
                        bodyResponse = { result: 'KO', reason: 'Something went wrong quering the DB', response: null };
                    })];
            case 1:
                _c.sent();
                if (!queryResult) return [3 /*break*/, 6];
                _loop_1 = function (row) {
                    var checkListTitle, query_excel_to_create, excelData, excelFile, excel_url, payload, response, pdf_url;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                checkListTitle = queryResult.rows[row].name;
                                query_excel_to_create = queryResult.rows[row].query_excel_to_create;
                                excelData = [];
                                if (!query_excel_to_create) return [3 /*break*/, 2];
                                // here it prepares secondary sheets to the main one
                                return [4 /*yield*/, pool
                                        .query(query_excel_to_create)
                                        .then(function (res) { return excelData.push(dataPrepare2xls(res, checkListTitle)); })["catch"](function (err) {
                                        console.error("Error executing query \"" + query_excel_to_create + "\"", err.stack);
                                        bodyResponse = { result: 'KO', reason: 'Something went wrong quering the DB', response: null };
                                    })];
                            case 1:
                                // here it prepares secondary sheets to the main one
                                _a.sent();
                                _a.label = 2;
                            case 2:
                                excelFile = excel.buildExport(excelData);
                                // configurations to upload the file on S3
                                filename = checkListTitle; // generate a 'unique' identifier as filename
                                s3ParamsInsert = {
                                    Bucket: process.env.BUCKET_NAME,
                                    Key: 'test/' + filename + '.xlsx',
                                    Body: excelFile
                                };
                                s3ParamsUrl = {
                                    Bucket: process.env.BUCKET_NAME,
                                    Key: 'test/' + filename + '.xlsx'
                                };
                                // upload to S3
                                return [4 /*yield*/, s3.putObject(s3ParamsInsert).promise()];
                            case 3:
                                // upload to S3
                                _a.sent();
                                excel_url = s3.getSignedUrl('getObject', s3ParamsUrl);
                                //generate pdf_url
                                console.log('Invoking reports...');
                                payload = {
                                    body: '"MT_Q&A_nosez_punt"',
                                    queryStringParameters: {
                                        company: "SITO",
                                        entry_name: "modelli_test_vr",
                                        form: "1",
                                        keys: "{\"codice_azienda\":\"SITO\",\"id_modello_test\": \"" + queryResult.rows[row].id_modello_test + "\",\"id_modello_test_vr\":\"" + queryResult.rows[row].id_modello_test_vr + "\"}"
                                    },
                                    httpMethod: 'POST'
                                };
                                return [4 /*yield*/, lambda.invoke({
                                        FunctionName: 'arn:aws:lambda:eu-central-1:360720986746:function:reports',
                                        Payload: JSON.stringify(payload)
                                    }).promise()];
                            case 4:
                                response = _a.sent();
                                pdf_url = JSON.parse(JSON.parse(response.Payload).body).url;
                                //push the check list
                                bodyResponse.response.push({
                                    name: queryResult.rows[row].name,
                                    sku: queryResult.rows[row].sku,
                                    partnerSku: queryResult.rows[row].partnersku,
                                    ean: queryResult.rows[row].ean,
                                    description: queryResult.rows[row].description,
                                    shortDescription: queryResult.rows[row].shortdescription,
                                    descriptionIt: queryResult.rows[row].descriptionit,
                                    descriptionEn: queryResult.rows[row].descriptionen,
                                    dateOnSaleFrom: today,
                                    dateOnSaleTo: nextYearFromToday,
                                    stock: queryResult.rows[row].stock,
                                    price: queryResult.rows[row].price,
                                    downloads: [{
                                            id: filename + '.xlsx',
                                            name: filename + '.xlsx',
                                            file: excel_url
                                        },
                                        {
                                            id: filename + '.pdf',
                                            name: filename + '.pdf',
                                            file: pdf_url
                                        }],
                                    downloadLimit: queryResult.rows[row].downloadlimit,
                                    downloadExpiry: queryResult.rows[row].downloadexpiry
                                });
                                return [2 /*return*/];
                        }
                    });
                };
                _a = [];
                for (_b in queryResult.rows)
                    _a.push(_b);
                _i = 0;
                _c.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                row = _a[_i];
                return [5 /*yield**/, _loop_1(row)];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                ;
                _c.label = 6;
            case 6:
                console.log('bodyResponse: ', JSON.stringify(bodyResponse));
                return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify(bodyResponse)
                    }];
        }
    });
}); };
