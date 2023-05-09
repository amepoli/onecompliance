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

// Get Bad URL Response
function getBadUrlResponse() {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 500,
        "error": "Bad URL"
    };
}

exports.handler = async (event) => {

    //Declare queryParams
    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    //console.log('queryParams: ', queryParams);

    const company = queryParams['company'];
    const requestType = queryParams['request_type'];
    const registry = queryParams['registry'];
    const check = queryParams['check'];
    const survey = queryParams['survey'];
    let client;
    let body;

    if (!requestType) {
        return getBadUrlResponse();
    }
    else {

        console.log('Lets start ', requestType);

        if (requestType === 'getConnectedRegistries') {

            /*First step of OneKYC, the one who retrieve data from DB to prepare the requests to regulat.io*/

            try {

                //Create new pool to connect the DB
                client = await pool.connect();

                let query = "";
                let response;

                /***
                IMPROVEMENT 1: Here we can think to get null if the input data isn't compliant with the 
                tool (like missing/wrong argument of question[tag] in survey template or company not enabled), and handle this case return info.
                IMPROVEMENT 2: Shrink the query, delete the UNION  
                ***/
                
                console.log('company: '+company+', registry: '+registry);
                
                //Prepare the query to get the connected registries, because i need to launch the tool on these too 
                query = `SELECT an.id_anagrafica AS connected_registry, tipo_soggetto AS entity_type, avr.ragione_sociale as company_name, an.nome as name, an.cognome as surname, an.nascita_data as yob, '' as role, coalesce(nullif(an.nome||' '||an.cognome,' '), avr.ragione_sociale) as registry_name
                FROM entrasp.anagrafiche_id an
                INNER JOIN entrasp.anagrafiche_vr avr ON an.codice_part=avr.codice_part AND an.id_anagrafica=avr.id_anagrafica 
                WHERE an.codice_part = (SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='${company}')
                AND an.id_anagrafica=${registry} 
                AND avr.prog_vr=entrasp.anagrafiche_vr_max(an.codice_part, avr.id_anagrafica)
                AND tipo_soggetto IS NOT NULL
                AND tipo_soggetto != 'C'
                AND an.id_anagrafica NOT IN (SELECT id_anagrafica FROM imports.aml_scans WHERE codice_azienda='${company}' AND date_of_scan = CURRENT_DATE and id_anagrafica is not null)
                UNION
                SELECT id_anagrafica_conn AS connected_registry, tipo_soggetto AS entity_type, avr.ragione_sociale as company_name, an.nome as name, an.cognome as surname, an.nascita_data as yob, r.descrizione as role, coalesce(nullif(an.nome||' '||an.cognome,' '), avr.ragione_sociale) as registry_name
                FROM entrasp.connessioni_anagrafiche ca 
                INNER JOIN entrasp.anagrafiche_id an ON ca.codice_part=an.codice_part AND ca.id_anagrafica_conn=an.id_anagrafica 
                INNER JOIN entrasp.anagrafiche_vr avr ON an.codice_part=avr.codice_part AND an.id_anagrafica=avr.id_anagrafica 
                LEFT JOIN entrasp.ruoli r ON ca.codice_ruolo=r.codice_ruolo
                WHERE ca.codice_part = (SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='${company}') 
                AND ca.id_anagrafica=${registry} 
                AND avr.prog_vr=entrasp.anagrafiche_vr_max(ca.codice_part, avr.id_anagrafica)
                AND tipo_soggetto IS NOT NULL
                AND ca.codice_ruolo IN ('TIEF','ESEC','COINT')
                AND ca.dt_fine IS NULL
                AND id_anagrafica_conn NOT IN (SELECT id_anagrafica FROM imports.aml_scans WHERE codice_azienda='${company}' AND date_of_scan = CURRENT_DATE and id_anagrafica is not null);`;

                //console.log('running query: ', query);
                response = await client.query(query);

                let connectedRegistries = null;

                if (response && response.rows) {
                    connectedRegistries = response.rows;
                    body = { result: 'OK', response: connectedRegistries };
                }
                else {
                    body = { result: 'KO', reason: 'Something wrong with getting registries from DB' };
                }

                //Release the client
                await client.release();

            } catch (e) {
                console.error(e.message, e.stack);
                await client.release();
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with accessing the DB" })
                };
            }
        }
        else if (requestType === 'getConnectedRegistriesFromCheck') {

            /*First step of OneKYC, the one who retrieve data from DB to prepare the requests to regulat.io*/

            try {

                //Create new pool to connect the DB
                client = await pool.connect();

                let query = "";
                let response;

                /***
                IMPROVEMENT 1: Here we can think to get null if the input data isn't compliant with the 
                tool (like missing/wrong argument of question[tag] in survey template or company not enabled), and handle this case return info.
                IMPROVEMENT 2: Shrink the query, delete the UNION  
                ***/

                console.log('company: '+company+', check: '+check);

                //Prepare the query to get the connected registries, because i need to launch the tool on these too 
                query = `SELECT an.id_anagrafica AS connected_registry, tipo_soggetto AS entity_type, avr.ragione_sociale as company_name, an.nome as name, an.cognome as surname, an.nascita_data as yob, '' as role, coalesce(nullif(an.nome||' '||an.cognome,' '), avr.ragione_sociale) as registry_name
                FROM entrasp.anagrafiche_id an
                INNER JOIN entrasp.anagrafiche_vr avr ON an.codice_part=avr.codice_part AND an.id_anagrafica=avr.id_anagrafica 
                WHERE an.codice_part = (SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='${company}')
                AND an.id_anagrafica=(SELECT split_part(object_key, '|', 2)::numeric FROM entrasp.sondaggi_somministrati WHERE codice_azienda='${company}' AND id_somministrazione=${check} AND object_name='anagraficheId')
                AND avr.prog_vr=entrasp.anagrafiche_vr_max(an.codice_part, avr.id_anagrafica)
                AND tipo_soggetto IS NOT NULL
                AND tipo_soggetto != 'C'
                AND an.id_anagrafica NOT IN (SELECT id_anagrafica FROM imports.aml_scans WHERE codice_azienda='${company}' AND date_of_scan = CURRENT_DATE and id_anagrafica is not null)
                UNION
                SELECT id_anagrafica_conn AS connected_registry, tipo_soggetto AS entity_type, avr.ragione_sociale as company_name, an.nome as name, an.cognome as surname, an.nascita_data as yob, r.descrizione as role, coalesce(nullif(an.nome||' '||an.cognome,' '), avr.ragione_sociale) as registry_name
                FROM entrasp.connessioni_anagrafiche ca 
                INNER JOIN entrasp.anagrafiche_id an ON ca.codice_part=an.codice_part AND ca.id_anagrafica_conn=an.id_anagrafica 
                INNER JOIN entrasp.anagrafiche_vr avr ON an.codice_part=avr.codice_part AND an.id_anagrafica=avr.id_anagrafica 
                LEFT JOIN entrasp.ruoli r ON ca.codice_ruolo=r.codice_ruolo
                WHERE ca.codice_part = (SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='${company}') 
                AND ca.id_anagrafica=(SELECT split_part(object_key, '|', 2)::numeric FROM entrasp.sondaggi_somministrati WHERE codice_azienda='${company}' AND id_somministrazione=${check} AND object_name='anagraficheId')
                AND avr.prog_vr=entrasp.anagrafiche_vr_max(ca.codice_part, avr.id_anagrafica)
                AND tipo_soggetto IS NOT NULL
                AND ca.codice_ruolo IN ('TIEF','ESEC','COINT')
                AND ca.dt_fine IS NULL
                AND id_anagrafica_conn NOT IN (SELECT id_anagrafica FROM imports.aml_scans WHERE codice_azienda='${company}' AND date_of_scan = CURRENT_DATE and id_anagrafica is not null);`;

                //console.log('running query: ', query);
                response = await client.query(query);

                let connectedRegistries = null;

                if (response && response.rows) {
                    connectedRegistries = response.rows;
                    body = { result: 'OK', response: connectedRegistries };
                }
                else {
                    body = { result: 'KO', reason: 'Something wrong with getting registries from DB' };
                }

                //Release the client
                await client.release();

            } catch (e) {
                console.error(e.message, e.stack);
                await client.release();
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with accessing the DB" })
                };
            }
        }
        else if (requestType === 'getConnectedChecks') {

            /*First step of OneKYC, the one who retrieve data from DB to prepare the requests to regulat.io*/

            try {

                //Create new pool to connect the DB
                client = await pool.connect();

                let query = "";
                let response;

                console.log('company: '+company+', survey: '+survey);

                //Prepare the query to get the connected checks, because i need to launch the tool on these too 
                query = `SELECT ss.id_somministrazione
                FROM entrasp.sondaggi snd 
                INNER JOIN entrasp.sondaggi_somministrati ss ON snd.codice_azienda=ss.codice_azienda AND snd.id_sondaggio=ss.id_sondaggio 
                WHERE snd.codice_azienda='${company}'
                AND snd.id_sondaggio=${survey} 
                AND ss.id_somministrazione NOT IN (
                    SELECT id_somministrazione 
                    FROM entrasp.risposte rp
                    INNER JOIN entrasp.domande dmd ON rp.codice_azienda=dmd.codice_azienda AND rp.id_domanda=dmd.id_domanda AND rp.id_modello_test=dmd.id_modello_test AND rp.id_modello_test_vr=dmd.id_modello_test_vr
                    WHERE rp.codice_azienda=ss.codice_azienda
                    AND rp.id_sondaggio=ss.id_sondaggio
                    AND dmd.id_argomento=45414 
                );`;

                //console.log('running query: ', query);
                response = await client.query(query);

                let connectedChecks = null;

                if (response && response.rows) {
                    connectedChecks = response.rows;
                    body = { result: 'OK', response: connectedChecks };
                }
                else {
                    body = { result: 'KO', reason: 'Something wrong with getting checks from DB' };
                }

                //Release the client
                await client.release();

            } catch (e) {
                console.error(e.message, e.stack);
                await client.release();
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with accessing the DB" })
                };
            }
        }
        else if (requestType === 'processScan') {

            /*Last step of OneKYC, the one who process data retrieved from regulat.io*/

            let scans = JSON.stringify(queryParams);

            if (scans == null) {
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with provided data" })
                };
            }

            try {

                //Create new pool to connect the DB
                client = await pool.connect();

                let query = "";
                let response;

                query = `INSERT INTO imports.aml_scans (codice_azienda,id_scan,id_anagrafica,scan_data, date_of_scan, entity_type, id_somministrazione, dynamo_user) 
                SELECT $$${scans}$$::json->>'company',$$${scans}$$::json->'extra'->>'scanId',($$${scans}$$::json->>'registry')::numeric,$$${scans}$$::json, CURRENT_DATE, $$${scans}$$::json->>'entityType', ($$${scans}$$::json ->> 'checkId')::numeric, $$${scans}$$::json->>'dynamoUser'
                ON CONFLICT DO NOTHING;`;

                console.log('running query: ', query);
                response = await client.query(query);
                
                //See the function in the db which answer the question of survey
                query = `select entrasp.OneKYC_process_aml_scans($$ ${scans} $$);`;

                //console.log('running query: ', query);
                response = await client.query(query);

                //release the client
                await client.release();

            } catch (e) {
                console.error(e.message, e.stack);
                await client.release();
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with accessing the DB" })
                };
            }

            body = { result: "OK" };
        }
        else {
            console.log('Invalid request type --> ', requestType);
            return getBadUrlResponse();
        }
        return {
            "statusCode": 200,
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "body": JSON.stringify(body)
        };
    }
};
