var aws = require('aws-sdk');
aws.config.update({ region: 'eu-central-1' });
var ddb = new aws.DynamoDB({ apiVersion: '2012-10-08' });
var ses = new aws.SES({ apiVersion: '2010-12-01' });
const dynamo = new aws.DynamoDB.DocumentClient();
const Pool = require('pg-pool');
const pool = new Pool({
    host: 'HOST_NAME',
    database: 'DB_NAME',
    user: 'postgres',
    password: 'et2themax',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

var sender_address = 'amedeo.poli@alacritas.eu';

// Some test addresses
//var admin_addresses = ['akhtar.syedzeeshan@alacritas.eu', 'amedeo.poli@alacritas.eu', 'nicola.capovilla@alacritas.eu'];

async function runQuery(query) {
    try {
        const client = await pool.connect();
        response = await client.query(query);
        if (response && response.rows && response.rows.length) {
            return response.rows;
        }
        else {
            console.log({ 'Success': false, 'Message': 'Postgresql: No data!', 'Error': null });
            return null;
        }
    }
    catch (e) {
        console.log({ 'Success': false, 'Message': 'Postgresql: Invalid request!', 'Error': e });
        return null;
    }
}

async function getEntry(templateKey) {
    try {
        templateKey = templateKey || "test";
        console.log(`Using templateKey: ${templateKey}`);

        const DynamoParams = {
            TableName: 'email_templates',
            Key: {
                templateKey: templateKey
            }
        };
        const data = await dynamo.get(DynamoParams).promise();
        if (data.Item) {
            return data.Item;
        }
        else {
            return null;
        }
    }
    catch (e) {
        console.log({ 'Success': false, 'Error': e });
    }
}

async function sendEmail(to, body, subject) {
    try {
        var eParams = {
            Destination: {
                ToAddresses: to
            },
            Message: {
                Body: {
                    Text: {
                        Charset: "UTF-8",
                        Data: body
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject
                }
            },

            // Replace source_email with your SES validated email address
            Source: sender_address
        };

        console.log(eParams);

        await ses.sendEmail(eParams).promise();

        console.log("EMAIL CODE END");
        return true;
    }
    catch (e) {
        console.log({ 'Success': false, 'Message': 'Could not send email!', 'Error': e });
        return false;
    }
}

exports.handler = async (event, context, callback) => {
    console.log(event);

    // Let's get entry from DynammoDB using templateKey from event
    const entry = await getEntry(event.templateKey);
    if (entry) {
        console.log(entry);

        // Run query
        let result = await runQuery(entry.query);
        if (result) {
            console.log(result[0]);

            // Send email
            let subject = "Gorico: Testing zee";
            let emailSent = await sendEmail(entry.to.split(','), entry.body, subject);
            if (emailSent) {
                console.log({ 'Success': true, 'Error': null })
            }
        }
    }
    callback(null, event);
};