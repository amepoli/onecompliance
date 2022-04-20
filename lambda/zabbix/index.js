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

    const prefix = 'zabbix/'; // topic prefis
    const company = event.topic.slice(prefix.length);

    console.log('Company is: ', company);

    const timestamp = Math.round(new Date().getTime()/1000);

    const client = await pool.connect();

    await client.release();
    
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};