const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-central-1' });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

/* const ObjectsToCsv = require('objects-to-csv');//'node-create-csv'
 */
const Pool = require('pg-pool');
const pool = new Pool({
    host: 'HOST_NAME',
    database: 'DB_NAME',
    user: 'USER_NAME',
    password: 'PASSWORD',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

const default_separator_out = ';';
const bucket_name = 'BUCKET_NAME';
const default_bucket = 'gorico2-migration';
const default_company = 'DEMO';
const default_folder = 'test';
const default_file_out = 'test_csv_creator.csv';

const default_query = 'SELECT 1 AS one,2 AS two,3 AS three';

/* const default_query = `select
'FININTSGR' AS ENTITA_SEGNALANTE,
CURRENT_DATE::date::varchar AS DATA_SEGNALAZIONE,
'NDG_ENTITA' AS NDG_ENTITA,
'NDG_GRUPPO' AS NDG_GRUPPO,
entrasp.pep_yn(ss.codice_azienda, ss.id_somministrazione) AS PEP,
entrasp.classe_rischio(snd.giudizio) as CLASSE_RISCHIO_VER,
ss.punteggio_ottenuto AS P_CLASSE_RISCHIO_VER,
entrasp.tipo_verifica(snd.giudizio) AS TIPO_VERIFICA,
ss.data_esecuzione::date::varchar AS DATA_CALC_RISCHIO
 from entrasp.sondaggi_somministrati ss 
 inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio 
 inner join entrasp.modelli_test_vr mtvr on snd.codice_azienda=mtvr.codice_azienda and snd.id_modello_test=mtvr.id_modello_test and snd.id_modello_test_vr=mtvr.id_modello_test_vr 
 inner join entrasp.modelli_test mt on snd.codice_azienda = mt.codice_azienda and snd.id_modello_test = mt.id_modello_test 
 left join entrasp.contratti cnt on snd.codice_azienda=cnt.codice_azienda and cnt.id_contratto=coalesce(ss.id_contratto,snd.id_contratto)
 where ss.codice_azienda='FININTSGR'
 and ((ss.codice_azienda='FININTSGR' and mt.id_tipo_modello_test = 50 and (snd.data_prevista<=CURRENT_DATE+ INTERVAL '100 days' or ss.data_esecuzione is not null)) 
      or (ss.codice_azienda='FININTSGR' and mt.id_tipo_modello_test = 50 and snd.data_prevista is null and ss.data_esecuzione is null)) 
 AND (split_part(ss.object_key, '|', 2)::numeric IN(SELECT id_cliente FROM entrasp.contratti WHERE stato!='C' and id_cliente is not null and codice_azienda='FININTSGR' UNION SELECT anx.id_anagrafica FROM entrasp.anagrafiche_id anx inner join entrasp.ruoli_anagrafiche ra on anx.id_anagrafica=ra.id_anagrafica and anx.codice_part=ra.codice_part where ra.codice_ruolo='CLI' and anx.codice_part='FININT' and anx.id_anagrafica not in(select cntx.id_cliente from entrasp.contratti cntx where cntx.codice_azienda='FININTSGR' and cntx.id_cliente is not null))) AND ss.somministrazione_completata='Completo' order by ss.id_somministrazione desc;
 `; */

var csvFile = '';

async function writeFileToS3(key, data, bucket = bucket_name) {
    console.log('Writing File to s3');
    var params = {
        Bucket: bucket,
        Key: key,
        Body: data
    }
    console.log(params.Key);
    await s3.putObject(params).promise();
}

async function start(bucket = bucket, company = default_company, folder = default_folder, file_out = default_file_out, queryToRun = default_query, separator_out = default_separator_out) {

    let response

    try {

        client = await pool.connect();

        console.log('running query: ', queryToRun);
        response = await client.query(queryToRun);
        //console.log('response: ', response);

        await client.release();

    } catch (e) {
        console.error(e);
    }

    try {
        if (response && response.rows && response.rows.length) {

            let property = Object.keys(response.rows[0]);

            for (let i = 0; i < property.length; i++) {
                csvFile += property[i] + (separator_out);
            }

            csvFile += "\r\n";

            for (let i = 0; i < response.rows.length; i++) {
                for (let j = 0; j < property.length; j++) {
                    csvFile += response.rows[i][property[j]] + (separator_out);
                }
                if (i < response.rows.length - 1) {
                    csvFile += "\r\n";
                }
            }

            console.log('csvFile: ', csvFile);

        }
    } catch (e) {
        console.error(e);
    }

    //console.log('csv: \r\n', csvFile);

    let s3ParamsPutObj = {
        Bucket: bucket,
        Key: "batch/" + company + "/" + folder + "/" + file_out,
        Body: csvFile,
        ContentType: 'text/csv'
    };

    await s3.putObject(s3ParamsPutObj).promise();

    //To delete the history, wtf??
    csvFile = '';

}

async function processQueryParams(queryParams) {

    let bucket = bucket_name ? bucket_name : default_bucket; //queryParams.bucket ? queryParams.bucket : default_bucket;
    let company = queryParams.company ? queryParams.company : default_company;
    let folder = queryParams.folder ? queryParams.folder : default_folder;
    let file_out = queryParams.file_out ? queryParams.file_out : default_file_out;
    let queryToRun = queryParams.query ? queryParams.query : default_query;
    let separator_out = queryParams.separator_out ? queryParams.separator_out : default_separator_out;
    
    await start(bucket, company, folder, file_out, queryToRun, separator_out);

}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;

    console.log(queryParams);

    let body = { result: 'OK' };

    if (queryParams && Object.keys(queryParams).length > 0) {
        await processQueryParams(queryParams);
    }
    else {
        await start();
    }

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};