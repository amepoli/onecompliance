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
    
    console.log(event);
    
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};