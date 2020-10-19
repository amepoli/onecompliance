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

var sender_address = 'amedeo.poli@auditft.it';

// Some test addresses
//var admin_addresses = ['akhtar.syedzeeshan@alacritas.eu', 'amedeo.poli@alacritas.eu', 'nicola.capovilla@alacritas.eu'];

async function runQuery(query) {
    try {
        const client = await pool.connect();
        let response = await client.query(query);
        await client.release();
        client = null;

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

async function getListOrQuery(input) {
    if (input != null) {
        if (input.list != null && input.list.length > 0) {
            if (input.list.includes(',')) {
                return input.list.split(',');
            }
            else {
                if (input.list.length > 0) {
                    return [input.list];
                }
                else {
                    return [];
                }
            }
        }
        else if (input.query != null && input.query.length > 0) {
            let result = await runQuery(input.query);
            if (result != null) {
                return result;
            }
        }
        else {
            return [];
        }
    }
}

async function getBody(body) {
    let result = "";

    if (body != null) {
        if (body.header != null && body.header.length > 0) {
            result += body.header + '\n';
        }
        if (body.query != null && body.query.length > 0) {
            let query_result = await runQuery(body.query);
            result += query_result[0] + '\n';
        }
        if (body.footer != null && body.footer.length > 0) {
            result += body.footer + '\n';
        }
    }

    return result;
}

async function sendEmail(to, cc, body, subject) {
    try {
        var eParams = {
            Destination: {
                ToAddresses: to,
                CcAddresses: cc,
                BccAddresses: null
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

        let result = true;
        if (entry.conditionalQuery && entry.conditionalQuery.length > 0) {
            // Run query
            result = await runQuery(entry.conditionalQuery);
        }
        if (result) {
            console.log(result[0]);

            // Get recipients
            let to = await getListOrQuery(entry.to);
            console.log('to', to);

            // Get CC
            let cc = await getListOrQuery(entry.cc);
            console.log('cc', cc);

            // Get body
            let body = await getBody(entry.body);

            // Send email
            let emailSent = await sendEmail(to, cc, body, entry.subject);
            if (emailSent) {
                console.log({ 'Success': true, 'Error': null })
            }
            else {
                console.log("Error: Could not send email!");
            }

        }
        else {
            console.log("Error: Could not run query!");
        }
    }
    callback(null, event);
};