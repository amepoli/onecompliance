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

function returnResponse(response) {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', data: response })
    };
}

function returnError (error) {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'KO', reason: error })
    };
}

exports.handler = async (event) => {

    console.log(event);
    
    const queryParams = event.queryStringParameters;

    console.log(queryParams);

    const company = queryParams['company'];
    const query = `
    SELECT 'sondaggi' as object_name , ('{"codice_azienda":"'||codice_azienda||'", "id_sondaggio":"'||id_sondaggio||'"}')::jsonb as object_id, titolo as titolo, descrizione as descrizione, data_prevista as data_inizio, data_esecuzione as data_fine, 'green' as event_color 
    FROM entrasp.sondaggi 
    WHERE codice_azienda='${company}' AND data_prevista is not null 
    --AND EXTRACT (YEAR FROM data_prevista)||'-'||EXTRACT (YEAR FROM data_prevista) = SUBSTR(CURRENT_DATE::varchar,0,8)
    UNION 
    SELECT 'compiti' as object_name , ('{"codice_azienda":"'||codice_azienda||'", "codice_compito":"'||codice_compito||'"}')::jsonb as object_id, titolo as titolo, note as descrizione, data_segnalazione as data_inizio, data_chiusura as data_fine, 'orange' as event_color 
    FROM entrasp.compiti 
    WHERE codice_azienda='${company}'
    --AND EXTRACT (YEAR FROM data_segnalazione)||'-'||EXTRACT (YEAR FROM data_segnalazione) = SUBSTR(CURRENT_DATE::varchar,0,8)
    UNION
    SELECT 'riunioni' as object_name , ('{"codice_azienda":"'||codice_azienda||'", "id_riunione":"'||id_riunione||'"}')::jsonb as object_id, convocazione as titolo, oggetto as descrizione, data_riunione as data_inizio, data_riunione as data_fine, 'blue' as event_color 
    FROM entrasp.riunioni 
    WHERE codice_azienda='${company}'
    --AND EXTRACT (YEAR FROM data_riunione)||'-'||EXTRACT (YEAR FROM data_riunione) = SUBSTR(CURRENT_DATE::varchar,0,8)
    UNION
	SELECT 'scadenziario' as object_name, ('{"codice_azienda":"'||codice_azienda||'", "codice_compito":"'||codice_compito||'"}')::jsonb as object_id, titolo as titolo, entrasp.argomenti_descr(id_argomento_tipo_evento) as descrizione, data_segnalazione as data_inizio, foreseen_date as data_fine, 'red' as event_color
	FROM entrasp.compiti 
	WHERE codice_azienda='${company}' AND id_tipo_segnalazione=701 AND foreseen_date IS NOT null
    LIMIT 365; 
    `;

    try {
        let response = await pool.query(query);
        console.log('returning: ', returnResponse(response));
        return returnResponse(response);
    }
    catch(e) {
        console.log('returning: ', returnResponse(e));
        return returnResponse(e);
    }
};
