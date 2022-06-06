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


exports.handler = async (event) => {
    
    let scans = event.scannedData;
    
    if (scans == null) {
        return { 
            "statusCode":200, 
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "body": JSON.stringify({"response" : "KO", "reason": "Something wrong with provided data"})
        }; 
    }


    
    try {
        const client = await pool.connect();
        
        let query = "";
        let response;
        
        /*
        for (let i= 0; i < scans.data.anti_money_laundering.length; i++) {
            let scan = scans.data.anti_money_laundering[i];
            
            if (scan != null) {
                query = "SELECT * from imports.regulat_aml_scan where type='"${scan.type}"';";
                response = await client.query(query);
                if (response.rows[0] == null) {
                    query = "INSERT INTO imports.archiflow_contratti_temporary (card_id, progressivo, data_firma, societa_fondo, controparte, partita_iva, tipo_fornitore, n_sistema) VALUES ('" 
                        + card.cardId + "', '" + card.progressivo + "', '" + card.dataFirma + "', '" + card.societaFondo.replace(/'/g, "''") + "', '" + card.controparte.replace(/'/g, "''") + "', '" + card.piva + "', '" + card.tipoFornitore.replace(/'/g, "''") + "', '" + card.numSistema  + "');" ;
                } else {
                    query = "UPDATE imports.archiflow_contratti_temporary SET card_id='" + card.cardId + "', progressivo='" + card.progressivo + "', data_firma='" + 
                        card.dataFirma + "', societa_fondo='" + card.societaFondo.replace(/'/g, "''") + "', controparte='" + card.controparte.replace(/'/g, "''") + 
                        "', partita_iva='" + card.piva + "', tipo_fornitore='" + card.tipoFornitore.replace(/'/g, "''") + "', n_sistema='" + card.numSistema  + "';";
                }
                response = await client.query(query);
            }
        }
        */

        // run process query
        query = `select entrasp.process_aml_scans('${scans}');`;
        response = await client.query(query);

        //release the client
        await client.release();
    } catch(e){
        return { 
            "statusCode":200, 
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "body": JSON.stringify({"response" : "KO", "reason": "Something wrong with accessing the DB"})
        }; 
    }
    

    return {
        "statusCode": 200,
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "body": JSON.stringify({"response" : "OK"}),
    };
};
