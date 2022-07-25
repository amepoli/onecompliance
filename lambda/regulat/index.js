const https = require('https');
const AWS = require('aws-sdk');
const axios = require('axios');
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
  const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
  console.log('queryParams: ', queryParams);

  const company = queryParams['company'];
  const registry = queryParams['registry'];
  const checkId = queryParams['checkId'];
  const connectedRegistries = JSON.parse(queryParams['connected_registries']);

 /*  let test = `{
    "data": {
        "SUCCESS": "sandbox",
        "anti_money_laundering": [{
                "TYPE": "PEP FAMILY MEMBER",
                "PERSON": {
                    "FULLNAME": "Donald John Trump Jr.",
                    "FIRSTNAME": "Donald John",
                    "MIDDLENAME": "",
                    "LASTNAME": "Trump",
                    "GENDER": "Male",
                    "DOB": "1977/12/XX"
                },
                "ADDRESS": {
                    "COUNTRY": "United States",
                    "STREET": "",
                    "ZIPCODE": "",
                    "CITY": ""
                },
                "ADDITIONAL": [
                    {
                        "TYPE": "Occupation",
                        "VALUE": "Nephew of Maryanne Trump Barry, Senior Federal Judge of the United States Court of Appeals for the Third Circuit",
                        "COMMENTS": "<br>Starting 0 Ending 0"
                    },
                    {
                        "TYPE": "Other",
                        "VALUE": "Link to WorldCompliance Online Database",
                        "COMMENTS": "<br>Trump, Donald John <br> https://members.worldcompliance.com/metawatch2.aspx?id=0029020e-dfe0-4433-a057-6b35742f1036"
                    },
                    {
                        "TYPE": "Other",
                        "VALUE": "Sources of Record Information",
                        "COMMENTS": "<br>https://en.wikipedia.org/wiki/Donald_Trump,_Jr. <br> https://en.wikipedia.org/wiki/Donald_Trump <br> http://www.huffingtonpost.com/the-six-pack/the-six-pack-donald-trump-jr_b_1348643.html?ir=India&adsSiteOverride=in <br> http://www.businessinsider.in/THE-TRUMP-5-Meet-the-fabulous-offspring-of-GOP-presidential-candidate-Donald-Trump/articleshow/47962879.cms <br> http://www.dailymail.co.uk/news/article-3127108/Donald-Trump-s-five-children-steal-spotlight-2016-announcement-nine-year-old-Barron-looking-especially-smart.html <br> http://www.thewrap.com/tv/column-post/donald-trump-sued-over-failed-mexican-resort-26578/ <br> http://www.nytimes.com/2000/08/11/classified/paid-notice-deaths-trump-mary-a.html <br> http://www.nytimes.com/1999/06/29/classified/paid-notice-deaths-trump-fred-c.html?scp=3&sq=Fred%20C.%20Trump&st=cse <br> http://www.nndb.com/people/363/000022297/"
                    },
                    {
                        "TYPE": "PlaceOfBirth",
                        "VALUE": "New York City, New York, United States",
                        "COMMENTS": ""
                    }
                ],
                "COMMENTS": "Source: International,Website || Level: National | Category: PEP | Subcategory: Family Member || Associations: | Father (PEP:Family Member): Trump, Donald John, 1930191 | Brother (PEP:Family Member): Trump, Barron, 2537480 | Brother (PEP:Family Member): Trump, Eric Fredrick, 2537479 | Sister (PEP:Family Member): Trump, Ivanka Marie, 2537485 | Sister (PEP:Family Member): Trump, Tiffany Ariana, 2537486 | Aunt (PEP:Courts): Trump Barry, Maryanne, 73874 || Last updated: 2016-03-23",
                "SanctionEntityId": "0029020e-dfe0-4433-a057-6b35742f1036"
            },
            {
                "TYPE": "National:PEP:Family Member",
                "PERSON": {
                    "FULLNAME": "Donald John Trump Sr.",
                    "FIRSTNAME": "Donald John",
                    "MIDDLENAME": "",
                    "LASTNAME": "Trump",
                    "GENDER": "Male",
                    "DOB": "1946/06/XX"
                },
                "ADDRESS": {
                    "STREET": "Trump Tower",
                    "CITY": "New York",
                    "COUNTRY": "United States",
                    "ZIPCODE": ""
                },
                "ADDITIONAL": [
                    {
                        "TYPE": "Occupation",
                        "VALUE": "Brother of Maryanne Trump Barry, Senior Judge of the United States Court of Appeals for the Third Circuit",
                        "COMMENTS": "<br>Starting 0 Ending 0"
                    },
                    {
                        "TYPE": "Other",
                        "VALUE": "Link to WorldCompliance Online Database",
                        "COMMENTS": "<br>Trump, Donald John <br> https://members.worldcompliance.com/metawatch2.aspx?id=bd3cd643-715a-4e6c-a8f5-3e0d00e7568b"
                    },
                    {
                        "TYPE": "Other",
                        "VALUE": "Sources of Record Information",
                        "COMMENTS": "<br>http://elpais.com/especiales/2015/donald-trump/ <br> https://en.wikipedia.org/wiki/Donald_Trump <br> http://www.koreaherald.com/view.php?ud=20151201000915 <br> http://2016.republican-candidates.org/Trump/ <br> http://www.cbsnews.com/news/trump-entertainment-resorts-files-for-bankruptcy/ <br> http://www.thefamouspeople.com/profiles/donald-trump-3378.php <br> http://www.trump.com/biography/ <br> http://time.com/3990496/donald-trump-children/ <br> http://www.businessinsider.in/THE-TRUMP-5-Meet-the-fabulous-offspring-of-GOP-presidential-candidate-Donald-Trump/articleshow/47962879.cms <br> http://www.dailymail.co.uk/news/article-3127108/Donald-Trump-s-five-children-steal-spotlight-2016-announcement-nine-year-old-Barron-looking-especially-smart.html <br> http://www.nytimes.com/2011/05/13/nyregion/feeling-deceived-over-homes-that-were-trump-in-name-only.html <br> https://theblacksphere.net/2015/08/45-noteworthy-facts-donald-trump/ <br> http://www.forbes.com/profile/donald-trump/ <br> https://www.worldcompliance.com/Search/Article.aspx?id=fa11b1aa-b32e-4faf-83ef-5feca07fd640 <br> http://www.trump.com/Donald_J_Trump/Biography.asp <br> http://www.thewrap.com/tv/column-post/donald-trump-sued-over-failed-mexican-resort-26578/ <br> http://www.reuters.com/article/2010/08/03/us-trumpsoho-lawsuit-idUSTRE67232X20100803?type=domesticNews <br> http://www.reuters.com/article/2010/08/03/us-trumpsoho-lawsuit-idUSTRE67232X20100803 <br> http://www.nndb.com/people/363/000022297/ <br> http://www.corporatecrimereporter.com/news/200/schneidermantrump832501/ <br> http://www.ag.ny.gov/press-release/ag-schneiderman-sues-donald-trump-trump-university-michael-sexton-defrauding-consumers"
                    },
                    {
                        "TYPE": "PlaceOfBirth",
                        "VALUE": "New York, , United States",
                        "COMMENTS": ""
                    }
                ],
                "COMMENTS": "Source: United States,US-New York State Attorney General || Level: National | Category: PEP | Subcategory: Family Member || Associations: | Wife (PEP:Family Member): Knauss-Trump, Melania, 2537468 | Son (PEP:Family Member): Trump, Barron, 2537480 | Son (PEP:Family Member): Trump, Donald John, 2537467 | Son (PEP:Family Member): Trump, Eric Fredrick, 2537479 | Daughter (PEP:Family Member): Trump, Ivanka Marie, 2537485 | Daughter (PEP:Family Member): Trump, Tiffany Ariana, 2537486 | Brother (PEP:Family Member): Trump, Robert S, 2537517 | Sister (PEP:Courts): Trump Barry, Maryanne, 73874 | Sister (PEP:Family Member): Trump Grau, Elizabeth Joan, 2537536 | Brother-in-law (PEP:Family Member): Grau, James Walter, 2537532 | Friend (PEP:Associate): Rahr, Stewart, 4640835 | Associate (Adverse Media:Investigation): Stillman, Roy, 2558376 | Affiliated Company (Adverse Media:Investigation): Bayrock Group LLC, 2558393 | Affiliated Company (Adverse Media:Investigation): SB Hotel Associates, 2558386 | Affiliated Company (Enforcement:Fraud): Trump Entrepreneur Institute, 3875122 || Last updated: 2016-03-22 || Profile Notes: According to the US-New York State Attorney General; August 25, 2013: Attorney General Eric T. Schneiderman announced that he has filed a lawsuit against Donald Trump, The Trump Entrepreneur Institute -- formerly named Trump University LLC (“Trump University”), and Michael Sexton, former President of Trump University for engaging in persistent fraudulent, illegal and deceptive conduct in connection with the operation of Trump University. Between 2005 through 2011, Trump University operated as an unlicensed educational institute that promised to teach Donald Trump’s real estate investing techniques to consumers nationwide but instead misled consumers into paying for a series of expensive courses that did not deliver on their promises.\n\nAn investigation by Attorney General Schneiderman revealed that Donald Trump did not handpick even a single instructor at these seminars and had little or no role in developing any of the Trump University curricula, or seminar content. The investigation also revealed that officials used the name “Trump University” even though they lacked the charter necessary under New York law to call themselves a University. They were also unlicensed under New York State Education Law, evading an array of legal protections designed to protect New Yorkers from fraud. The lawsuit seeks full restitution for the more than 5,000 consumers nationwide who were defrauded of over $40 million in the scheme, disgorgement of profits, as well as costs and penalties and injunctive relief prohibiting these types of illegal practices going forward.\n\nAccording to the reuters.com; August 03, 2010: Donald Trump and the promoters of his Trump SoHo hotel-condominium were sued by buyers who accused them of fraudulently touting out-sized sales figures to encourage them to buy units and inflate the projects financial health. The lawsuit by 15 plaintiffs was filed late Monday in Manhattan federal court, less than four months after the 46-story building opened and three months after the offering plan went effective, allowing closings to begin.\n\nPolitical Party: Republican Party.\n\nCareer:\nCandidate for President of the United States in the 2016 presidential election;\nChairman and President of The Trump Organization;\nFounder of Trump Entertainment Resorts;\nJoint partner with the National Broadcasting Company (NBC)  (2003).",
                "SanctionEntityId": "bd3cd643-715a-4e6c-a8f5-3e0d00e7568b"
            }
 
 ]
    },
    "meta": {
        "code": "200",
        "message": "Success"
    },
    "extra": {
        "scanId": "d5c114b8-74ac-4067-bb4d-113"
    },
    "company": "DEMO-KYC",
    "entityType": "P",
    "registry": "309",
    "checkId": "1025" 
}`;
  console.log(JSON.parse(test)[0].data);
  console.log(JSON.parse(test)[1].data);
  console.log(JSON.parse(test)[0].checkId);
  console.log(JSON.parse(test)[1].checkId); 
   let response = await lambda.invoke({
      FunctionName: 'FUNCTION_NAME',
      Payload: test      //to change the payload?,  how can i pass a requestType? --> 'getAmlScan' 
    }).promise();
   return ({
    "statusCode": 200,
    "isBase64Encoded": false,
    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    "body": JSON.stringify({ result: 'OK' })
  });
   const entityType = queryParams['entityType'];
    const name = queryParams['name'];
    const surname = queryParams['surname'];
    const yob = queryParams['yob']; */


  //Configure Post for authenticate, username and password of test
  var postData_login = JSON.stringify({
    "username": "f7ee43b4-99ae-42d3-bf70-63507cc15055_test",
    "password": "QXPTmDfw8ABMTfN6kfE8114lyDk7rfJdJnoLMVHZbMElttnexbaETBSZs9YWkaQ3JVDkEDrmHFXVQM"
  });

  var options_login = {
    "method": "POST",
    "hostname": "https://app.regulat.io",
    "path": "/api/auth/token",
    "headers": {
      "Content-Type": "application/json",
    }
  };

  /*********************************** MAYBE SOMETHING LIKE THIS? ************************************
  var clientId = "MyApp";
  var clientSecret = "MySecret";
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
  };  *************************************************************************************************/

  var options_getScan = {
    "method": "POST",
    "hostname": "https://app.regulat.io/api/kyc/v1/company",
    "path": "/api/auth/token",
    "headers": {
      "Content-Type": "application/json",
    }
  };
 
  /* 
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
  } */
  var username = 'f7ee43b4-99ae-42d3-bf70-63507cc15055_test';
  var password = 'QXPTmDfw8ABMTfN6kfE8114lyDk7rfJdJnoLMVHZbMElttnexbaETBSZs9YWkaQ3JVDkEDrmHFXVQM';

    const tokenParams = `${username}:${password}`;
    const encodedToken = Buffer.from(tokenParams).toString('base64');

  let token = await axios.post('https://app.regulat.io/api/auth/token', 
  {grant_type: 'client_credentials'}, {
    headers: { 'Authorization': 'Basic ' + encodedToken, 
    'Content-Type': 'multipart/form-data'}}
    /* auth: {
      username: 'f7ee43b4-99ae-42d3-bf70-63507cc15055_test',
      password: 'QXPTmDfw8ABMTfN6kfE8114lyDk7rfJdJnoLMVHZbMElttnexbaETBSZs9YWkaQ3JVDkEDrmHFXVQM'
    } */
  );

  console.log('token:', token);
  //let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3JlZ3VsYXQuaW8iLCJhdWQiOlsicmVndWxhdGlvLmFwaSJdLCJpYXQiOjE2NTg3NDQyNzksIm5iZiI6MTY1ODc0NDI3OSwic3ViIjoiZjdlZTQzYjQtOTlhZS00MmQzLWJmNzAtNjM1MDdjYzE1MDU1X3Rlc3QiLCJ1c2VyX21ldGFkYXRhIjp7ImxhbmciOiJlbiJ9LCJhcHBfbWV0YWRhdGEiOnsiY2xpZW50X2lkIjoiZjdlZTQzYjQtOTlhZS00MmQzLWJmNzAtNjM1MDdjYzE1MDU1X3Rlc3QiLCJPcmdhbml6YXRpb25JZCI6IjM4MTBlZTI4LWQ0YzAtNDBjNS1hOGQxLTIwMjhlYTIxODQ1MiIsInNjb3BlIjpbIktZQzpBcGlBY2Nlc3MiXX19.MBTPi3VV77_643zNRQdHWpH7rFXAQR3tI3r_I8-qvCk";//response.access_token;

  //Get Scans for all the connectedRegistries and for the main registry
  for (let i = 0; i < connectedRegistries.length; i++) {
    
    console.log(i);
    console.log(connectedRegistries[i].entity_type);

    //Configure Post for scan, it depends on the entityType (see the technical notes doc)
    if (connectedRegistries[i].entity_type === 'P') {
      var postData_getScan = {
        "access_token": "",
        "refresh_token": "",
        "firstname": "",
        "lastname": "",
        "yob": "",
        "responseType": "json"
      };
      postData_getScan.firstname = connectedRegistries[i].name ? connectedRegistries[i].name : '';
      postData_getScan.lastname = connectedRegistries[i].surname ? connectedRegistries[i].surname : '';
      postData_getScan.yob = connectedRegistries[i].yob ? connectedRegistries[i].yob : '';
      
      console.log(postData_getScan);

    } else if (connectedRegistries[i].entity_type === 'E') {
      var postData_getScan = {
        "access_token": "",
        "refresh_token": "",
        "company": "",
        "responseType": "json"
      };
      postData_getScan.company = connectedRegistries[i].company_name ? connectedRegistries[i].company_name : '';

      console.log(postData_getScan);

    };

    //Get Scan
    postData_getScan.access_token = token;
    postData_getScan = JSON.stringify(postData_getScan);
    console.log(postData_getScan);
    //response = await post(options_getScan, postData_getScan);
    scannedData = /* scannedData + */ await post(options_getScan, postData_getScan); //How can i do it? scannedData has to be json
    if (response == null) {
      return ({
        "statusCode": 200,
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "body": JSON.stringify({ result: 'KO', reason: 'Something wrong with getting scan' })
      });
    }
    console.log(scannedData);
  }

  /* //To implement, add into response json these parameters i need in regulat_VPC
  scannedData = scannedData.add(company, registry, checkId); */

  //Call regulat_VPC
  response = await lambda.invoke({
    FunctionName: 'FUNCTION_NAME',
    Payload: scannedData      //to change the payload?,  how can i pass a requestType? --> 'getAmlScan' 
  }).promise();

  return ({
    "statusCode": 200,
    "isBase64Encoded": false,
    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    "body": JSON.stringify({ result: 'OK' })
  });
};
