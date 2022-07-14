const https = require('https');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const lambda = new AWS.Lambda({
  region: 'eu-central-1'
});

function post(options, postData) {
  return new Promise(((resolve, reject) => {
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
      }

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    request.write(postData);
    request.end();
  }));
}

exports.handler = async (event, context) => {

  //Declare queryParams

  const company = queryParams['company'];
  const registry = queryParams['registry'];
  const checkId = queryParams['checkId'];

  //See if it is ok
  const connectedRegistries = queryParams['connectedRegistries'];

  const entityType = queryParams['entityType'];
  const name = queryParams['name'];
  const surname = queryParams['surname'];
  const yob = queryParams['yob'];


  //Configure Post for authenticate
  var postData_login = JSON.stringify({
    "username": "f7ee43b4-99ae-42d3-bf70-63507cc15055_test",
    "password": "QXPTmDfw8ABMTfN6******************************M"
  });

  var options_login = {
    "method": "POST",
    "hostname": "https://app.regulat.io",
    "path": "/api/auth/token",
    "headers": {
      "Content-Type": "application/json",
    }
  };

  /* MAYBE SOMETHING LIKE THIS?

  var clientId = "MyApp";
  var clientSecret = "MySecret";

  // var authorizationBasic = $.base64.btoa(clientId + ':' + clientSecret);
  var authorizationBasic = window.btoa(clientId + ':' + clientSecret);

  var request = new XMLHttpRequest();
  request.open('POST', oAuth.AuthorizationServer, true);
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  request.setRequestHeader('Authorization', 'Basic ' + authorizationBasic);
  request.setRequestHeader('Accept', 'application/json');
  request.send("username=John&password=Smith&grant_type=password");

  request.onreadystatechange = function () {
      if (request.readyState === 4) {
        alert(request.responseText);
      }
  };

  */

  //Configure Post for scan, it depends on the entityType (see the technical notes doc)
  if (entityType == 'P') {
    var postData_getScan = {
      "access_token": "",
      "refresh_token": "",
      "firstname": "",
      "lastname": "",
      "yob": "",
      "responseType": "json"
    };
    postData_getScan.firstname = name;
    postData_getScan.lastname = surname;
    postData_getScan.yob = yob;

  } else if (entityType == 'E') {
    var postData_getScan = {
      "access_token": "",
      "refresh_token": "",
      "company": "",
      "responseType": "json"
    };
    postData_getScan.company = name;
  };

  var options_getScan = {
    "method": "POST",
    "hostname": "https://app.regulat.io",
    "path": "/api/auth/token",
    "headers": {
      "Content-Type": "application/json",
    }
  };

  
  //Get token
  let response = await post(options_login, postData_login);
  //let response = await post(options_test, postData_test);
  if (response == null || response.access_token == null) {
    return ({
      "statusCode": 200,
      "isBase64Encoded": false,
      "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      "body": JSON.stringify({ result: 'KO', reason: 'Something wrong with getting access token' })
    });
  }
  let token = response.access_token;


  //Get Scan
  postData_getScan.access_token = token;
  postData_getScan = JSON.stringify(postData_getScan);
  //response = await post(options_getScan, postData_getScan);
  scannedData = await post(options_getScan, postData_getScan);
  if (response == null) {
    return ({
      "statusCode": 200,
      "isBase64Encoded": false,
      "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      "body": JSON.stringify({ result: 'KO', reason: 'Something wrong with getting scan' })
    });
  }


  //Repeat for all the connectedRegistries, if exists,
  for (let i = 0; i < connectedRegistries.length; i++) {
    //Configure Post for scan, it depends on the entityType (see the technical notes doc)
    if (entityType == 'P') {
      var postData_getScan = {
        "access_token": "",
        "refresh_token": "",
        "firstname": "",
        "lastname": "",
        "yob": "",
        "responseType": "json"
      };
      postData_getScan.firstname = connectedRegistries.name[i] ? connectedRegistries.name[i] : '';
      postData_getScan.lastname = connectedRegistries.surname[i] ? connectedRegistries.surname[i] : '';
      postData_getScan.yob = connectedRegistries.yob[i] ? connectedRegistries.yob[i] : '';

    } else if (entityType == 'E') {
      var postData_getScan = { 
        "access_token": "",
        "refresh_token": "",
        "company": "",
        "responseType": "json"
      };
      postData_getScan.company = connectedRegistries.company_name[i] ? connectedRegistries.company_name[i] : '';
    };

    //Get Scan
    postData_getScan.access_token = token;
    postData_getScan = JSON.stringify(postData_getScan);
    //response = await post(options_getScan, postData_getScan);
    scannedData = scannedData + await post(options_getScan, postData_getScan); //How can i do it? scannedData has to be json
    if (response == null) {
      return ({
        "statusCode": 200,
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "body": JSON.stringify({ result: 'KO', reason: 'Something wrong with getting scan' })
      });
    }
  }

  //To implement, add into response json these parameters i need in regulat_VPC
  scannedData = scannedData.add(company, registry, checkId);

  //Call regulat_VPC
  response = await lambda.invoke({
    FunctionName: 'FUNCTION_NAME',
    Payload: scannedData      //to change the payload?,  how can i pass a requestType? --> 'getAmlScan' 
  }).promise();

  console.log(response);

  return ({
    "statusCode": 200,
    "isBase64Encoded": false,
    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    "body": JSON.stringify({ result: 'OK' })
  });
};
