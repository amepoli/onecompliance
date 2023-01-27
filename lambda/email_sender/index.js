var aws = require('aws-sdk');
aws.config.update({ region: 'REGION' });
var ses = new aws.SES({ apiVersion: '2010-12-01' });
const s3 = new aws.S3({ apiVersion: '2006-03-01' });

//For handle attachments
const nodemailer = require('nodemailer');

let data = {
    Destination: {
        ToAddresses: ['akhtar.syedzeeshan@gmail.com'],
        CcAddresses: [],
        BccAddresses: null
    },
    Message: {
        Body: {
            Text: {
                Charset: "UTF-8",
                Data: 'Body!'
            }
        },
        Subject: { Charset: 'UTF-8', Data: 'Test email' }
    },
    Source: 'amedeo.poli@alacritas.eu'
};


async function sendEmail(to, cc, body, subject, sender, attachments) {
    try {

        let transporter = nodemailer.createTransport({
            SES: ses
        });

        let attachmentsList = null;
        if (attachments && attachments.length > 0) {
            attachmentsList = [];
            for (const attachment of attachments) {
                const s3ParamsGetList = {
                    Bucket: 'BUCKET_NAME',
                    Key: attachment.path
                };
                const object = await s3.getObject(s3ParamsGetList).promise();
                if (object && object.Body) {
                    attachmentsList.push({ filename: attachment.name, content: object.Body });
                }
                else {
                    console.log('There was an error trying to download attachment from s3: ' + attachment.name);
                }
            }
        }

        // var eParams = {
        //     Destination: {
        //         ToAddresses: to,
        //         CcAddresses: cc,
        //         BccAddresses: null
        //     },
        //     Message: {
        //         Body: {
        //             Text: {
        //                 Charset: "UTF-8",
        //                 Data: body
        //             },
        //             Html: {
        //                 Data: body
        //             }
        //         },
        //         Subject: {
        //             Charset: "UTF-8",
        //             Data: subject
        //         }//,
        //         //Attachments: attachmentsList
        //     },
        //     Source: sender
        // };

        // console.log(eParams);

        // let result = await ses.sendEmail(eParams).promise();

        var eParams = {
            from: sender,
            to: to,
            subject: subject,
            text: body,
            html: body,
            attachments: attachmentsList
        };

        console.log(eParams);

        let result = await transporter.sendMail(eParams);

        console.log("EMAIL CODE END");
        return result;
    }
    catch (e) {
        console.log({ 'Success': false, 'Message': 'Could not send email!', 'Error': e });
        return false;
    }
}

exports.handler = async (event, context, callback) => {
    console.log('event');
    console.log(JSON.parse(event));

    let result = { 'Success': false, 'Message': null, 'Error': 'Could not send email!' };

    let data = JSON.parse(event).data;
    if (data) {
        console.log('data');
        console.log(JSON.parse(event).data);
        let to = data.to;
        let cc = data.cc;
        let body = data.body;
        let subject = data.subject;
        let sender = data.sender;
        let attachments = data.attachments;
        let emailResponse = await sendEmail(to, cc, body, subject, sender, attachments);
        if (emailResponse && emailResponse.MessageId) {
            result = { 'Success': true, 'Message': emailResponse, 'Error': null };
        }
        else {
            result = { 'Success': false, 'Message': emailResponse, 'Error': 'Could not send email!' };
        }
    }
    callback(null, result);
};