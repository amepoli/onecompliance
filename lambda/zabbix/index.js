const Pool = require('pg-pool');
const pool = new Pool({
    host: 'HOST_NAME',
    database: 'zabbix',
    user: 'USER_NAME',
    password: 'PASSWORD',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});


exports.handler = async (event) => {

    const prefix = "zabbix/"; // topic prefix
    const codice_azienda = event.topic.slice(prefix.length);

    delete event.topic;

    console.log("Company is: ", codice_azienda);

    const timestamp = new Date().toISOString();
    
    let JSON_object = JSON.stringify(event);

    try {
        
        let client = await pool.connect();

        /* PROCESSO IL RECORD */

        if (JSON_object.indexOf("\"hosts\"") != -1) {

            console.log('Hosts');
            const query = `SELECT imports.process_object('${codice_azienda}', '${timestamp}', '${JSON_object}');`;
            
            console.log(query);

            let reply = await client.query(query);

            console.log(JSON.stringify(reply));

        } else {

            console.log('No hosts');
            
            const query = `INSERT INTO imports.imported_objects (codice_azienda, data_import, object) values ('${codice_azienda}', '${timestamp}', '${JSON_object}');`;

            console.log(query);

            let reply = await client.query(query);

            console.log(JSON.stringify(reply));
        }

        await client.end();

    } catch (e) {
        console.log(e);
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify("Hello from Lambda!"),
    };
    return response;
};
