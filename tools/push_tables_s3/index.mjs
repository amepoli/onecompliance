import { exit } from "process";
import { readFileSync } from "fs";

import AWS from "aws-sdk";
AWS.config.update({ region: "eu-central-1" });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// import AmazonDaxClient from "amazon-dax-client";
// const dax = new AmazonDaxClient({
//     region: "eu-central-1",
//     endpoint: "daxs://DAX_ENDPOINT",
// });
// const dynamo = new AWS.DynamoDB.DocumentClient({
//     service: DAX_ENABLED ? dax : null,
// });

// print process.argv
process.argv.forEach(function (val, index, array) {
    console.log(index + ": " + val);
});

const putItemUsingDAX = async function () {
    console.log(`We have to push ${process.argv[2]} on VIEWS_NAME`);
    const DynamoParams = {
        TableName: "profiles",
        Item: {
            name: "zee_test",
            data: "ASDFASDFASDF",
        },
    };

    let result = await dynamo.put(DynamoParams).promise();

    console.log("Result: ", result);
    exit(0);
};


const putItemUsingS3 = async function () {
    console.log(`We have to push ${process.argv[3]} on ${process.argv[2]}`);
    const imagePath = `../../dynamo-tables/${process.argv[3]}.json`
    const blob = readFileSync(imagePath)
    
    const uploadedImage = await s3.upload({
        Bucket: 'gorico2.dynamodb',
        Key: `${process.argv[2]}/${process.argv[3]}.json`,
        Body: blob,
      }).promise()

    exit(0);
};


await putItemUsingS3();
