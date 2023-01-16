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

    console.log('Hello from lambda mailing_list (: ');
    
    let caller_url = event.headers.host + event.requestContext.path;
    console.log('Caller: ',caller_url);

    let result;

    await pool
        .query(`select * from entrasp.mailing_list();`)
        .then(res => result = res.rows.length > 0 ? res : null) 
        .catch(err => console.error('Error executing query', err.stack))

    if (result) {
        
        let mail_to, 
            mail_body,
            mail_subject,
            mail_sender, 
            query_excel_to_create;

        result.rows.forEach(row => {
            
            mail_to = row.mail_to;
            mail_body = row.mail_body;
            mail_subject = row.mail_subject;
            mail_sender = row.mail_sender;
            query_excel_to_create = row.query_excel_to_create;

            //generate excel report (multiple rows in query_excel_to_create)
            //join it
            //send email
            
        });

    }
    
    return {
        "statusCode": 200,
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "body": 'OK'
    };
};
