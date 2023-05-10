import * as excel from 'node-excel-export';
import * as AWS from 'aws-sdk';
import * as Pool from 'pg-pool';

AWS.config.update({ region: process.env.REGION });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const pool = new Pool({
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

    const styles = {
        headerDark: {
            fill: {
                fgColor: {
                    rgb: 'FF008000'
                },

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
                },
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
                },
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
    const heading = [
        [{
            value: title,
            style: styles.title
        }] // <-- It can be only values
    ];

    //console.log('generate secondary sheets with dataset: ', dataset);
    const specification = {};

    let property = Object.keys(dataset.rows[0]);
    for (let i = 0; i < property.length; i++) {
        specification[property[i]] = {
            displayName: property[i],
            headerStyle: styles.data,
            width: 120
        };
    }

    const merges = [{
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
        name: title, // <- Specify sheet name (optional)
        heading: heading, // <- Raw heading array (optional)
        merges: merges, // <- Merge cell ranges
        specification: specification, // <- Report specification
        data: dataset.rows // <-- Report data
    }
}


exports.handler = async () => {
    // 1 - Query the DB to pick the checklist to send
    let queryResult;
    let bodyResponse = { result: 'Ok', reason: null, response: [] };
    let d = new Date();
    const today = d.toISOString();
    d.setFullYear(d.getFullYear() + 1);
    const nextYearFromToday= d.toISOString();

    let query = `SELECT 'select coalesce(id_sezione,1) as sezione, ordinamento, descrizione as domanda, note as note_domanda, entrasp.risposte_previste_mostra1(codice_azienda, id_modello_test, id_modello_test_vr, id_domanda) as risposte_previste from entrasp.domande where codice_azienda=''SITO'' and id_modello_test='||mt.id_modello_test||' and id_modello_test_vr='||mtvr.id_modello_test_vr||' order by id_sezione asc, ordinamento asc' query_excel_to_create,
                    mt.titolo AS name,
                    concat_ws('.',mt.id_modello_test,mtvr.id_modello_test_vr,mt.codice) AS sku,
                    concat_ws('.',mt.id_modello_test,mtvr.id_modello_test_vr,mt.codice) AS partnersku,
                    '0' AS ean,
                    mt.descrizione AS description,
                    mt.titolo AS shortdescription,
                    mt.descrizione AS descriptionit,
                    mt.descrizione AS descriptionen,
                    CURRENT_TIMESTAMP AS dateonsalefrom,
                    CURRENT_TIMESTAMP+interval '1 year' AS dateonsaleto,
                    '999' AS stock,
                    '49.99' AS price,
                    NULL AS downloads,
                    '-1' AS downloadlimit,
                    '-1' AS downloadexpiry
                FROM entrasp.modelli_test mt
                INNER JOIN entrasp.modelli_test_vr mtvr
                    ON mt.codice_azienda=mtvr.codice_azienda
                    AND mt.id_modello_test=mtvr.id_modello_test
                WHERE mtvr.id_modello_test_vr=entrasp.grc_max_id_mdt_vr(mt.codice_azienda, mt.id_modello_test)
                    AND mt.codice_azienda='SITO'
                    AND mtvr.data_ins::date = CURRENT_DATE;`;

    await pool
        .query(query)
        .then((res: any) => queryResult = res.rows.length > 0 ? res : null)
        .catch((err: Error) => {
            console.error(`Error executing query "${query}"`, err.stack);
            bodyResponse = { result: 'KO', reason: 'Something went wrong quering the DB', response: null }
        });

    if (queryResult) {

        for (const row in queryResult.rows) {

            let checkListTitle = queryResult.rows[row].name;
            let query_excel_to_create = queryResult.rows[row].query_excel_to_create;

            // generate report

            let excelData = [];

            if (query_excel_to_create) {
                // here it prepares secondary sheets to the main one
                await pool
                    .query(query_excel_to_create)
                    .then((res: any) => excelData.push(dataPrepare2xls(res, checkListTitle)))
                    .catch((err: Error) => {
                        console.error(`Error executing query "${query_excel_to_create}"`, err.stack);
                        bodyResponse = { result: 'KO', reason: 'Something went wrong quering the DB', response: null }
                    });
            }

            // generate the file
            let excelFile = excel.buildExport(excelData);

            // configurations to upload the file on S3
            var filename = checkListTitle + '.xlsx'; // generate a 'unique' identifier as filename

            var s3ParamsInsert = {
                Bucket: process.env.BUCKET_NAME,
                Key: 'test/' + filename,
                Body: excelFile
            };
            var s3ParamsUrl = {
                Bucket: process.env.BUCKET_NAME,
                Key: 'test/' + filename
            };

            // upload to S3
            await s3.putObject(s3ParamsInsert).promise();

            // get the uploaded file url
            let url = s3.getSignedUrl('getObject', s3ParamsUrl);

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
                    id: filename,
                    name: filename,
                    file: url
                }],
                downloadLimit: queryResult.rows[row].downloadlimit,
                downloadExpiry: queryResult.rows[row].downloadexpiry
            });
        };
    }

    console.log('bodyResponse: ',JSON.stringify(bodyResponse));

    return {
        statusCode: 200,
        body: JSON.stringify(bodyResponse)
    };
};