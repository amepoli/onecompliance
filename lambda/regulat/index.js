const https = require('https');
const AWS = require('aws-sdk');
const axios = require('axios');
AWS.config.update({ region: 'eu-central-1' });
const lambda = new AWS.Lambda({
  region: 'eu-central-1'
});

exports.handler = async (event, context) => {

  //Declare queryParams
  const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
  //console.log('queryParams: ', queryParams);

  const company = queryParams['company'];
  const checkId = queryParams['checkId'];
  const dynamoUser = queryParams['dynamoUser'];
  const connectedRegistries = JSON.parse(queryParams['connected_registries']);
  const isLightScan = queryParams['isLightScan'] ? 'LIGHTSCAN' : '';
  let hostName;
  let scannedData = '';

  /*** Get token ***/
  //1.Define credentials
  var username = 'f7ee43b4-99ae-42d3-bf70-63507cc15055_test';                                        //'cc5b3703-185f-43fa-a492-e76e003eb842_prod';                                         //'f7ee43b4-99ae-42d3-bf70-63507cc15055_test';
  var password = 'QXPTmDfw8ABMTfN6kfE8114lyDk7rfJdJnoLMVHZbMElttnexbaETBSZs9YWkaQ3JVDkEDrmHFXVQM';  //'rz8TZs8zpQl4Kd0lc8qda7usmqxRTjV058aJdig0LkIko5bEe5gik5wkuwG6i1Nspbddv6uwOlux5yW';   //'QXPTmDfw8ABMTfN6kfE8114lyDk7rfJdJnoLMVHZbMElttnexbaETBSZs9YWkaQ3JVDkEDrmHFXVQM';

  //2.Generate encodedToken of username and password for Basic auth
  const tokenParams = `${username}:${password}`;
  const encodedToken = Buffer.from(tokenParams).toString('base64');

  //3.Posting token
  let token = await axios.post('https://app.regulat.io/api/auth/token',
    { grant_type: 'client_credentials' }, {
    headers: {
      'Authorization': 'Basic ' + encodedToken,
      'Content-Type': 'multipart/form-data',
      'Access-Control-Allow-Origin': '*'
    }
  });
  //console.log('Token:', token.data.access_token);


  /*** Get Scans ***/
  //for all the connectedRegistries and for the main registry
  for (let i = 0; i < connectedRegistries.length; i++) {

    //1.Configure data for scan, it depends on the entityType P or E (see the technical notes doc)
    if (connectedRegistries[i].entity_type && connectedRegistries[i].entity_type === 'P') {
      var postData_getScan = {
        "firstname": "",
        "lastname": "",
        "yob": "",
        "responseType": "json",
        "scanType": isLightScan
      };
      postData_getScan.firstname = connectedRegistries[i].name ? connectedRegistries[i].name : '';
      postData_getScan.lastname = connectedRegistries[i].surname ? connectedRegistries[i].surname : '';
      postData_getScan.yob = connectedRegistries[i].yob ? connectedRegistries[i].yob : '';
      hostName = "https://app.regulat.io/api/kyc/v1/person";

    } else if (connectedRegistries[i].entity_type && connectedRegistries[i].entity_type === 'E') {
      var postData_getScan = {
        "company": "",
        "responseType": "json",
        "scanType": isLightScan
      };
      postData_getScan.company = connectedRegistries[i].company_name ? connectedRegistries[i].company_name : '';
      hostName = "https://app.regulat.io/api/kyc/v1/company";

    };

    postData_getScan = JSON.stringify(postData_getScan);
    console.log("postData_getScan: ", postData_getScan);

    try {

      //2.Posting data
      scannedData = await axios.post(hostName,
        postData_getScan, {
        headers: {
          'Authorization': 'Bearer ' + token.data.access_token,
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      return ({
        "statusCode": e.statusCode,
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "body": JSON.stringify({ result: 'KO', reason: 'Something wrong with getting scan' })
      });
    }

    if (scannedData == null) {
      return ({
        "statusCode": 200,
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "body": JSON.stringify({ result: 'KO', reason: 'Something wrong with getting scan' })
      });
    }

    //3.Append to the ScannedData the other data i need
    scannedData.data["registry"] = connectedRegistries[i].connected_registry;
    scannedData.data["role"] = connectedRegistries[i].role;
    scannedData.data["registry_name"] = connectedRegistries[i].registry_name;
    scannedData.data["entityType"] = connectedRegistries[i].entity_type;
    scannedData.data["company"] = company;
    scannedData.data["checkId"] = checkId;
    scannedData.data["dynamoUser"] = dynamoUser;
    scannedData.data["request_type"] = 'processScan';
    scannedData.data["scanType"] = isLightScan;

    //4.Call regulat_VPC to process the data
    response = await lambda.invoke({
      FunctionName: 'FUNCTION_NAME',
      Payload: JSON.stringify(scannedData.data)
    }).promise();

  }

  return ({
    "statusCode": 200,
    "isBase64Encoded": false,
    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    "body": JSON.stringify({ result: 'OK' })
  });
};
