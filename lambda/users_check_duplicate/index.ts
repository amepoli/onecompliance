import * as AWS from 'aws-sdk';
import * as Pool from 'pg-pool';

AWS.config.update({ region: process.env.REGION });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const dynamo = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// const pool = new Pool({
//     host: process.env.HOST_NAME,
//     database: process.env.DB_NAME,
//     user: process.env.USER_NAME,
//     password: process.env.PASSWORD,
//     port: process.env.PORT,
//     max: 1,
//     min: 0,
//     idleTimeoutMillis: 300000,
//     connectionTimeoutMillis: 1000
// });

async function sendEmail(to, body, subject) {
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
        Source: 'service@alacritas.eu'
    };

    var email = await ses.sendEmail(eParams).promise();
    console.log('Sent email: ',eParams);
}

exports.handler = async () => {

    let bodyResponse = { result: 'Ok', reason: null, response: [] };

    let users_table = await dynamo.scan({
        TableName: 'USERS_NAME',
        ProjectionExpression: "userid,companies,createdAt,email,#dynobase_language,lastname,#dynobase_name,onekyc,picture,showTimeTracker,sync,username",
        ExpressionAttributeNames: { "#dynobase_name": "name", "#dynobase_language": "language" }
    }).promise();


    // let queryResult;

    // let users_json = JSON.stringify(users_table.Items);

    // let query = `SELECT entrasp.dynamodb_users_insert($$${users_json}$$::json);`;

    // await pool
    //     .query(query)
    //     .then((res: any) => queryResult = res.rows.length > 0 ? res : null)
    //     .catch((err: Error) => {
    //         console.error(`Error executing query "${query}"`, err.stack);
    //         bodyResponse = { result: 'KO', reason: 'Something went wrong quering the DB', response: null }
    //     });


    //send email if find overlaps
    let bodyEmail = 'Sono stati riscontrati i seguenti conflitti anagrafici tra differenti user: \n';
    let send = false;
    for (let i = 0; i < users_table.Items.length - 1; i++) {
        for (let j = 0; j < users_table.Items[i].companies.L.length; j++) {
            for (let k = i + 1; k < users_table.Items.length; k++) {
                for (let l = 0; l < users_table.Items[k].companies.L.length; l++) {
                    if (users_table.Items[i].companies.L[j]?.M?.id_anagrafica?.N &&
                        users_table.Items[i].companies.L[j]?.M?.id_anagrafica?.N == users_table.Items[k].companies.L[l]?.M?.id_anagrafica?.N
                        && users_table.Items[i].companies.L[j].M?.name?.S == users_table.Items[k].companies.L[l].M?.name?.S) {

                        send = true;
                        bodyEmail = bodyEmail + ' - anagrafiche uguali su ' + users_table.Items[i].companies.L[j].M.name.S + ' per gli utenti ' + users_table.Items[i].username.S + ' e ' + users_table.Items[k].username.S + '\n';

                    }
                }
            }
        }
    }

    if (send) {
        await sendEmail(['service@alacritas.eu','info@alacritas.eu'], bodyEmail, 'Conflitti di "id_anagrafica" tra users');
    }

    return {
        isBase64Encoded: false,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        statusCode: 200,
        body: JSON.stringify(bodyResponse)
    };
};