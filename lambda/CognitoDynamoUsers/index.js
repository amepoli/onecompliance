var aws = require('aws-sdk');
aws.config.update({region: 'eu-central-1'});
var ddb = new aws.DynamoDB({apiVersion: '2012-10-08'});
var ses = new aws.SES({apiVersion: '2010-12-01'});

var sender_address = 'nicola.capovilla@alacritas.eu';
var admin_address = 'amedeo.poli@alacritas.eu';

async function sendEmail(to, body, subject) {
    var eParams = {
        Destination: {
            ToAddresses: [to]
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

    var email = await ses.sendEmail(eParams).promise();
    console.log(email);
    console.log("EMAIL CODE END");
}

exports.handler = async (event, context, callback) => {
    console.log(event);

    let date = new Date();

    const tableName = 'users';
    const defaultImg = 'default_user.png';
    
    var content, subject;

    // If the required parameters are present, proceed
    if (event.triggerSource === 'PostConfirmation_ConfirmSignUp' && event.request.userAttributes.sub != null) {

        // -- Write data to DDB
        let ddbParams = {
            Item: {
                'userid': {S: event.request.userAttributes.sub},
                'picture': {S: defaultImg},
                'username': {S: event.userName},
                'email': {S: event.request.userAttributes.email},
                'createdAt': {S: date.toISOString()},
                'name': {S: 'Mario'},
                'lastname': { S: 'Rossi' },
                "companies": {
                    "L": [
                        {
                            "M": {
                                "name": {
                                    "S": "DEMO"
                                },
                                "profile": {
                                    "S": "admin"
                                },
                                "id_anagrafica": {
                                    "NULL": true
                                }
                            }
                        }]
                },
                'language': { S: 'it' }
            },
            TableName: tableName
        };

        // Call DynamoDB
        try {
            await ddb.putItem(ddbParams).promise();
            console.log("User added to DB");
            subject = "Il tuo utente è stato confermato / Your account has been confirmed";
            content = "Congratulazioni,\nIl Suo account è stato confermato.\nPotrebbe servire qualche minuto ancora perché venga configurato correttament.\n\nCongratulations,\your account has been confirmed.\nIt might take few minutes to fully configure it\n\nThe Gorico Team.";
            await sendEmail(event.request.userAttributes.email, content, subject);
            console.log("Confirmation: Sent an email to the user");
            // Return to Amazon Cognito
            callback(null, event);
        } catch (err) {
            console.log("Error", err);
        }
    } else if(event.triggerSource === 'PreSignUp_SignUp' && event.request.userAttributes.email != null) {
        event.response.autoConfirmUser = false;
        subject = "Gorico: nuova richiesta utente '" + event.userName + "'";
        content = "Nuova richiesta - Utente: '" + event.userName + "'' - Email: " + event.request.userAttributes.email;
        try {
            console.log(content);
            await sendEmail(admin_address, content, subject);
            console.log("Sign-up: Sent an e-mail to the admin");
            callback(null, event);
        } catch (err) {
            console.log(err);
        }
    } else {
        // Nothing to do, the user's email ID is unknown
        console.log("Error: Nothing was written to DDB or SQS");
        callback(null, event);
    } 
};