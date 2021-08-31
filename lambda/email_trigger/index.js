var aws = require('aws-sdk');
aws.config.update({ region: 'REGION' });
var lambda = new aws.Lambda({
    region: 'REGION' //change to your region
});

async function compose_email(payload) {
    let composeEmail =
        await lambda.invoke({
            //FunctionName: 'arn:aws:lambda:us-west-2:xxxxxx:function:TrackIP',
            FunctionName: 'arn:aws:lambda:eu-central-1:360720986746:function:email_composer',
            Payload: JSON.stringify(payload)
        }).promise();

    console.log('email_compose', composeEmail);

    if (composeEmail.Payload) {
        if (composeEmail.Payload.errorMessage) {
            return { 'Success': false, 'Data': null, 'Error': composeEmail.Payload.errorMessage };
        }
        else {
            return { 'Success': true, 'Data': composeEmail.Payload, 'Error': null };
        }
    }
    else {
        return { 'Success': false, 'Data': null, 'Error': 'Could not compose email!' };
    }
}

async function send_email(payload) {
    let sendEmail =
        await lambda.invoke({
            //FunctionName: 'arn:aws:lambda:us-west-2:xxxxxx:function:TrackIP',
            FunctionName: 'arn:aws:lambda:eu-central-1:360720986746:function:email_sender',
            Payload: JSON.stringify(payload)
        }).promise();

    console.log('email_sender', sendEmail);

    if (sendEmail.Payload) {
        return { 'Success': true, 'Message': sendEmail.Payload, 'Error': null };
    }
    else {
        return { 'Success': false, 'Message': null, 'Error': 'Could not send email!' };
    }
}


exports.handler = async (event, context, callback) => {
    console.log(event);

    let composeEmailResponse = await compose_email(event);

    if (composeEmailResponse.Success && composeEmailResponse.Data) {
        let sendEmailResponse = await send_email(composeEmailResponse.Data);
        if (sendEmailResponse.Success && sendEmailResponse.Message) {

            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 200,
                "body": JSON.stringify(sendEmailResponse.Message)
            };
            // callback(null, JSON.parse(sendEmailResponse.Message));
        }
        else {
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 200,
                "body": JSON.stringify(sendEmailResponse.Error)
            };
            // callback(null, JSON.parse(sendEmailResponse.Error));
        }
    }
    else {
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 200,
            "body": JSON.stringify(composeEmailResponse.Error)
        };
        // callback(null, JSON.parse(composeEmailResponse.Error));
    }
};