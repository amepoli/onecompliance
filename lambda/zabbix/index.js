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

    await pool
        .query(`SELECT imports.process_object('${codice_azienda}', '${timestamp}', $$${JSON_object}$$::json);`)
        .then(res => console.log('Done'))
        .catch(err => console.error('Error executing query', err.stack))

    /*
    try {

    //PROCESSO IL RECORD

    let client = await pool.connect();

    const query = `SELECT imports.process_object('${codice_azienda}', '${timestamp}', $$${JSON_object}$$::json);`;

    console.log(query);

    let reply = await client.query(query);

    //console.log(JSON.stringify(reply));

    await client.end();
   
    } catch (e) {
        console.log(e);
        await client.end();
    }
    */
    
    const response = {
        statusCode: 200,
        body: 'OK'
    };
    return response;
};
