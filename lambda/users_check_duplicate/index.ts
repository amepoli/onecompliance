import * as AWS from 'aws-sdk';
import * as Pool from 'pg-pool';

AWS.config.update({ region: process.env.REGION });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const dynamo = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const pool = new Pool({
    host: process.env.HOST_NAME,
    database: process.env.DB_NAME,
    user: process.env.USER_NAME,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});


exports.handler = async () => {
    // 1 - Query the DB to pick the checklist to send
    let queryResult;
    let bodyResponse = { result: 'Ok', reason: null, response: [] };
    let d = new Date();
    const today = d.toISOString();
    d.setFullYear(d.getFullYear() + 1);
    const nextYearFromToday = d.toISOString();

    let users_table = await dynamo.scan({
        TableName: 'users',
        ProjectionExpression: "userid,companies,createdAt,email,#dynobase_language,lastname,#dynobase_name,onekyc,picture,showTimeTracker,sync,username",
        ExpressionAttributeNames: { "#dynobase_name": "name", "#dynobase_language": "language" }
    }).promise();

    let users_json=JSON.stringify(users_table.Items);

    let query = `SELECT entrasp.dynamodb_users_insert($$${users_json}$$::json);`;

    await pool
        .query(query)
        .then((res: any) => queryResult = res.rows.length > 0 ? res : null)
        .catch((err: Error) => {
            console.error(`Error executing query "${query}"`, err.stack);
            bodyResponse = { result: 'KO', reason: 'Something went wrong quering the DB', response: null }
        });

    if (queryResult) {
        //send email if critical
    }

    return {
        isBase64Encoded: false,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        statusCode: 200,
        body: JSON.stringify(bodyResponse)
    };
};