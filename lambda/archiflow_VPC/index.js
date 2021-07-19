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
    // TODO implement
    
    let cards = event.processedCards;
    
    if (cards == null) {
        return { statusCode:200, body: JSON.stringify({"response" : "KO", "reason": "Something wrong with provided data"})};
    }
    
    
    
    try {
        const client = await pool.connect();
        
        let query = "";
        

        for (let i= 0; i < cards.length; i++) {
            let card = cards[i];
            
            if (card.cardId != null) {
                query = "SELECT * from imports.archiflow_contratti_temporary where card_id='" + card.cardId + "';";
                let response = await client.query(query);
                console.log(response);
                if (response.rows[0] == null) {
                    query = "INSERT INTO imports.archiflow_contratti_temporary (card_id, progressivo, data_firma, societa_fondo, controparte, partita_iva, tipo_fornitore, n_sistema) VALUES ('" 
                        + card.cardId + "', '" + card.progressivo + "', '" + card.dataFirma + "', '" + card.societaFondo.replace(/'/g, "''") + "', '" + card.controparte.replace(/'/g, "''") + "', '" + card.piva + "', '" + card.tipoFornitore.replace(/'/g, "''") + "', '" + card.numSistema  + "');" ;
                    response = await client.query(query);
                    console.log(response);
                }
            }
        }
        await client.release();
    } catch(e){
        return { statusCode:200, body: JSON.stringify({"response" : "KO", "reason": "Something wrong with accessing the DB"})}; 
    }
    

    return {
        statusCode: 200,
        body: JSON.stringify({"response" : "OK"}),
    };
};
