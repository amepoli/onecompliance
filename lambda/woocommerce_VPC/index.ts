import * as excel from 'node-excel-export';
import * as AWS from 'aws-sdk';
import * as Pool from 'pg-pool';

AWS.config.update({ region: process.env.REGION });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const lambda = new AWS.Lambda({ region: process.env.REGION });

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
    const nextYearFromToday = d.toISOString();

    let query = `SELECT 'select coalesce(id_sezione,1) as sezione, (select descrizione from entrasp.domande_sezioni where id_modello_test=domande.id_modello_test and id_modello_test_vr=domande.id_modello_test_vr and codice_azienda=domande.codice_azienda and id_sezione=domande.id_sezione ) as descrizione_sezione, ordinamento, descrizione as domanda, punteggio as punteggio_domanda, note as note_domanda, entrasp.risposte_previste_mostra1(codice_azienda, id_modello_test, id_modello_test_vr, id_domanda) as risposte_previste from entrasp.domande where codice_azienda=''SITO'' and id_modello_test='||mt.id_modello_test||' and id_modello_test_vr='||mtvr.id_modello_test_vr||' order by id_sezione asc, ordinamento asc' query_excel_to_create,
                    mt.id_modello_test,
                    mtvr.id_modello_test_vr,
                    mt.titolo AS name,
                    mt.id_modello_test AS sku,
                    mt.id_modello_test AS partnersku,
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
                    '-1' AS downloadexpiry,
                                        (select array_agg(entrasp.argomenti_descr_breve_no_id(id_argomento_father)::varchar)
                                        from entrasp.argomenti_argomenti 
                                        where id_argomento_son=mt.id_argomento 
                                        and id_argomento_father in (select entrasp.descendants_of_argomento(349, 1) union select entrasp.descendants_of_argomento(133, 1))) as tags,
                    true as published										
                FROM entrasp.modelli_test mt
                INNER JOIN entrasp.modelli_test_vr mtvr
                    ON mt.codice_azienda=mtvr.codice_azienda
                    AND mt.id_modello_test=mtvr.id_modello_test
                WHERE mtvr.id_modello_test_vr=entrasp.grc_max_id_mdt_vr(mt.codice_azienda, mt.id_modello_test)
                    AND mt.codice_azienda='SITO'
                    AND (mtvr.data_ins::date = CURRENT_DATE OR mtvr.data_upd::date=CURRENT_DATE);`;

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
            var filename = checkListTitle; // generate a 'unique' identifier as filename

            var s3ParamsInsert = {
                Bucket: process.env.BUCKET_NAME,
                Key: 'test/' + filename + '.xlsx',
                Body: excelFile
            };
            var s3ParamsUrl = {
                Bucket: process.env.BUCKET_NAME,
                Key: 'test/' + filename + '.xlsx'
            };

            // upload to S3
            await s3.putObject(s3ParamsInsert).promise();

            // get the uploaded file url
            let excel_url = s3.getSignedUrl('getObject', s3ParamsUrl);

            //generate pdf_url

            let payload = {
                body: '"MT_sito"',
                queryStringParameters: {
                    company: "SITO",
                    entry_name: "modelli_test_vr",
                    form: "1",
                    keys: `{"codice_azienda":"SITO","id_modello_test": "${queryResult.rows[row].id_modello_test}","id_modello_test_vr":"${queryResult.rows[row].id_modello_test_vr}"}`
                },
                httpMethod: 'POST'
            }

            let response: any = await lambda.invoke({
                FunctionName: 'arn:aws:lambda:eu-central-1:360720986746:function:reports_prod',
                Payload: JSON.stringify(payload)
            }).promise();

            let pdf_url = JSON.parse(JSON.parse(response.Payload).body).url;

            //push the check list
            bodyResponse.response.push({
                name: queryResult.rows[row].name,
                sku: queryResult.rows[row].sku,
                partnerSku: queryResult.rows[row].partnersku,
                ean: queryResult.rows[row].sku,
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
                downloadExpiry: queryResult.rows[row].downloadexpiry,
                tags: queryResult.rows[row].tags,
                published: queryResult.rows[row].published
            });

        };
    }

    console.log('bodyResponse: ', JSON.stringify(bodyResponse));

    return {
        isBase64Encoded: false,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        statusCode: 200,
        body: JSON.stringify(bodyResponse)
    };
};