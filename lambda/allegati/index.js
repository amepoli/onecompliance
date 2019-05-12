const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

exports.handler = async (event, context) => {

    console.log(event);
    
    var params = { 
        Bucket: 'gorico2.core',
        Prefix: event.id_centro_gest,
        MaxKeys: event.numItems
    };

    let s3Objects;

    try {
       s3Objects = await s3.listObjectsV2(params).promise();
       console.log(s3Objects);
    } catch (e) {
       console.log(e);
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(s3Objects || {message: 'No objects found in s3 bucket'})
    };
};