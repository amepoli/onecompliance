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

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    console.log('queryParams: ', queryParams);
    
    const company = queryParams['company'];
    const requestType = queryParams['request_type'];

    if (!requestType) {
        return getBadUrlResponse();
    }
    else {
        console.log('Lets start ', requestType);

        if (requestType === 'getConnectedRegistries') {
            try {
                const client = await pool.connect();

                let query = "";
                let response;

                query = `select id_anagrafica_conn as connected_registry, tipo_soggetto as connected_entity_type, avr.denominazione FROM entrasp.connessioni_anagrafiche ca INNER JOIN entrasp.anagrafiche_id an ON ca.codice_part=an.codice_part AND ca.id_anagrafica_conn=an.id_anagrafica INNER JOIN entrasp.anagrafiche_vr avr ON an.codice_part=avr.codice_part AND an.id_anagrafica=avr.id_anagrafica WHERE ca.codice_part = (SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='${company}') and ca.id_anagrafica=${registry} and avr.prog_vr=entrasp.anagrafiche_vr_max(ca.codice_part, avr.id_anagrafica);`;
                //connectedRegistries = await client.query(query);

                console.log('running query: ', query);
                
                response = await client.query(query);
                console.log('response', response.rows);

                let connectedRegistries = null;
                if(response && response.rows) {
                    connectedRegistries = response.rows;
                }
                body = { result: 'OK', response: connectedRegistries };

                //release the client
                await client.release();

            } catch (e) {
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with accessing the DB" })
                };
            }
            /* return {
                "statusCode": 200,
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "body": JSON.stringify({ "response": "OK" }),
            }; */
        }
        else if (requestType === 'getAmlScan') {

            let scans = event.scannedData;

            if (scans == null) {
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with provided data" })
                };
            }

            try {
                const client = await pool.connect();

                let query = "";
                let response;

                // run process query
                query = `select entrasp.process_aml_scans('${scans}');`;
                response = await client.query(query);

                //release the client
                await client.release();

            } catch (e) {
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with accessing the DB" })
                };
            }
            return {
                "statusCode": 200,
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "body": JSON.stringify({ "response": "OK" }),
            };
        }
        else {
            return getBadUrlResponse();
        }
    }
    
};
