const https = require('https');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
var lambda = new AWS.Lambda({
    region: 'eu-central-1' //change to your region
});

var postData_login = JSON.stringify({
    "strUser":"ALACRITAS",
    "strPassword":"ALACRITAS",
    "oConnectionInfo": {
        "Language": "0",
        "DateFormat": "dd/mm/yyyy",
        "WorkflowDomain": "SIAV"
    }
  });

var options_login = {
  "method": "POST",
  "hostname": "afmobile.finint.com",
  "path": "/ArchiflowService/Login.svc/json/Login",
  "headers": {
    "Content-Type": "application/json",
  }
};

var postData_getCards = {
    "paramIn": {
        "SessionInfo": {
            "CharacterSet": 1,
            "ClientType": 0,
            "DateFormat": "dd/MM/yyyy",
            "ExecutiveOfficeCode": 0,
            "ExecutiveOffices": [],
            "Language": 0,
            "LoginTicketUserId": null,
            "LoginType": 1,
            "SessionId": "",
            "TokenSess": "192.168.200.84",
            "VelocisDatabase": "arcsql50",
            "VelocisServer": "RDS",
            "WorkflowId": ""
        },
        "SearchCriteria": {
        },
        "PageNumber": 1,
        "PageSize": 282,
        "GetIndexes": true,
        "GetInvoice": false
    }
};


var options_getCards = {
  "method": "POST",
  "hostname": "afmobile.finint.com",
  "path": "/archiflowservice/Card.svc/json/RetrieveCardsByParam",
  "headers": {
    "Content-Type": "application/json",
  }
};

var tipoFornitoreFilter = ["CONSULENTE TECNICO", "CONSULENTE FISCALE", "LEGALE /AMMINISTRATIVO"];

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
    // TODO implement
    
    let response = await post(options_login, postData_login);
    //let response = await post(options_test, postData_test);
    
    if (response == null || response.oSessionInfo == null ||  response.oSessionInfo.SessionId == null || response.oSessionInfo.WorkflowId == null) {
      return({statusCode: 200, body: JSON.stringify({result: 'KO', reason: 'Something wrong with login'})});
    }
    
    let token = response.oSessionInfo.SessionId;
    
    let wid = response.oSessionInfo.WorkflowId;
    
    postData_getCards.paramIn.SessionInfo.SessionId = token;
    
    postData_getCards.paramIn.SessionInfo.WorkflowId = wid;
    
    postData_getCards = JSON.stringify(postData_getCards);
    
    response = await post(options_getCards, postData_getCards);
    
    if (response == null || response.RetrieveCardsByParamResult == null ||  response.RetrieveCardsByParamResult.Cards == null) {
      return({statusCode: 200, body: JSON.stringify({result: 'KO', reason: 'Something wrong with getting doc list'})});
    }
    
    let cards = response.RetrieveCardsByParamResult.Cards;
    
    let processedCards = [];
    
    cards.forEach(card => {
      let cardId = card.CardId;
      let indexes = card.Indexes;
      if (indexes != null) {
        let dataFirma = '';
        let societaFondo = '';
        let controparte = '';
        let piva = '';
        let tipoFornitore = '';
        indexes.forEach(index => {
          if (index.FieldDescription === 'Data firma' ) {
            dataFirma = index.FieldValue;
          } else if (index.FieldDescription === 'Società/Fondo' ) {
            societaFondo = index.FieldValue;
          } else if (index.FieldDescription === 'Controparte' ) {
            controparte = index.FieldValue;
          } else if (index.FieldDescription === 'P.IVA' ) {
            piva = index.FieldValue;
          } else if (index.FieldDescription === 'Tipologia fornitore' ) {
            tipoFornitore = index.FieldValue;
          } 
        });
        if (tipoFornitoreFilter.indexOf(tipoFornitore) > -1) {
          processedCards.push({"cardId": cardId, "dataFirma": dataFirma, "societaFondo": societaFondo, "controparte": controparte, "piva": piva, "tipoFornitore": tipoFornitore});
        }
      }
    });
    
    console.log(processedCards);
    
    response = await lambda.invoke({
            FunctionName: 'arn:aws:lambda:eu-central-1:360720986746:function:archiflow_VPC',
            Payload: JSON.stringify({processedCards})
        }).promise();
    
    /*response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };*/
    return response;
};
