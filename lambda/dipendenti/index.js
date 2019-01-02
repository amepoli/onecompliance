var pg = require("pg");

const Pool = require('pg-pool');
const pool = new Pool({
    host: 'goricotest.caxbbckt9xen.eu-central-1.rds.amazonaws.com',
    database: 'GoRiCo',
    user: 'postgres',
    password: 'et2themax',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});


exports.handler = function(event, context, callback) {
  
context.callbackWaitsForEmptyEventLoop = false; // don't know why, but this prevents the lambda to hang

var codice_part = event.queryStringParameters.codice_part;
var id = event.queryStringParameters.id;

var form = [
    { 
      type: 'input',
      label: 'ID',
      inputType: 'text',
      name: 'id_anagrafica',
      value: '',
      readonly: 'true'
    },
    {
      type: 'input',
      label: 'Codice',
      inputType: 'text',
      name: 'codice',
      value: '',
      readonly: 'false',
      validations: [
        {
          name: 'required',
          validator: 'Validators.required',
          message: 'Codice mancante'
        },
        {
          name: 'pattern',
          validator: '^[a-zA-Z1-9&_. ]+$',
          message: 'Uso caratteri non ammessi'
        }
      ]
    },
    {
      type: 'input',
      label: 'Nome',
      inputType: 'text',
      name: 'nome',
      value: '',
      readonly: 'false',
      validations: [
        {
          name: 'required',
          validator: 'Validators.required',
          message: 'Nome obbligatorio'
        },
        {
          name: 'pattern',
          validator: '^[a-zA-Z ]+$',
          message: 'Uso caratteri non ammessi'
        }
      ]
    },
    {
      type: 'input',
      label: 'Cognome',
      inputType: 'text',
      name: 'cognome',
      value: '',
      readonly: 'false',
      validations: [
        {
          name: 'required',
          validator: 'Validators.required',
          message: 'Cognome obbligatorio'
        },
        {
          name: 'pattern',
          validator: '^[a-zA-Z ]+$',
          message: 'Uso caratteri non ammessi'
        }
      ]
    }
    ];


var queryString = 
`SELECT 
anagrafiche_id.id_anagrafica, 
anagrafiche_id.codice, 
anagrafiche_id.cognome, 
anagrafiche_id.nome, 
ruoli_anagrafiche.codice_part
FROM 
entrasp.anagrafiche_id, 
entrasp.ruoli, 
entrasp.ruoli_anagrafiche
WHERE 
anagrafiche_id.codice_part = ruoli_anagrafiche.codice_part AND
ruoli_anagrafiche.codice_ruolo = ruoli.codice_ruolo AND
ruoli.codice_ruolo ='DIP' AND
anagrafiche_id.codice_part='${codice_part}' ;`;

var queryString_element = 
`SELECT id_anagrafica,codice,cognome,nome from entrasp.anagrafiche_id 
WHERE codice_part='${codice_part}' AND id_anagrafica='${id}';`

var queryString_next = 
`SELECT (MAX(id_anagrafica)+1) as prossimo from entrasp.anagrafiche_id WHERE codice_part='${codice_part}';`

var deleteString = `DELETE FROM entrasp.anagrafiche_id
      WHERE codice_part='${codice_part}' AND id_anagrafica='${id}';`;

var body;

if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
   body = JSON.parse(event.body.toString()); // drove me crazy!!!!
   
   var insertNewString = `INSERT INTO entrasp.anagrafiche_id 
        (codice_part, id_anagrafica, codice, cognome, nome)
        VALUES
       ('${codice_part}', ${body['id_anagrafica']}, '${body['codice']}', '${body['cognome']}', 
         '${body['nome']}')
         RETURNING id_anagrafica;`;
    
     var updateString = `
         UPDATE entrasp.anagrafiche_id
         SET codice = '${body['codice']}',
             cognome = '${body['cognome']}',
             nome = '${body['nome']}'
         WHERE codice_part='${codice_part}' AND id_anagrafica='${body['id_anagrafica']}'`;   
}

if (event.httpMethod === "POST") {

  let client;
  pool.connect().then(c => {
       client = c;
        return client.query(updateString);
    }).then(res => {
        client.release();
        var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "isBase64Encoded": false,
            "body": JSON.stringify(res.rows)
        };
        console.log(response);
        callback(null, response);
   }).catch(error => {
        console.log("ERROR", error);
        const response =  {
           "isBase64Encoded": false,
            "statusCode": 500,
            "body": JSON.stringify(error)
        };
        callback(null, response);
      });
}

if (event.httpMethod === "DELETE") {
  
  let client;
  pool.connect().then(c => {
        client = c;
        return client.query(deleteString);
    }).then(res => {
      client.release();
      var response = {
          "statusCode": 200,
          "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
          "isBase64Encoded": false,
          "body": JSON.stringify(res.rows)
      };
      callback(null, response);
    }).catch(error => {
        console.log("ERROR", error);
        const response =  {
            "isBase64Encoded": false,
            "statusCode": 500,
            "body": JSON.stringify(error)
        };
        callback(null, response);
    });
}

if (event.httpMethod === "PUT") {

  let client;
  pool.connect().then(c => {
        client = c;
        return client.query(insertNewString);
    }).then(res => {
        client.release();
        var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "isBase64Encoded": false,
            "body": JSON.stringify(res.rows)
        };
        console.log(response);
        callback(null, response);
    }).catch(error => {
        console.log("ERROR", error);
        const response =  {
            "isBase64Encoded": false,
            "statusCode": 500,
            "body": JSON.stringify(error)
        };
        callback(null, response);
    });
}

if (event.httpMethod === "GET") {
  let client;
  if (id === '') {
    pool.connect().then(c => {
          client = c;
          
          return client.query(queryString);
      }).then(res => {
        client.release();
        var response = {
          "statusCode": 200,
          "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
          "body": JSON.stringify(res.rows),
          "isBase64Encoded": false
        };
        callback(null, response);
      }).catch(error => {
          console.log("ERROR", error);
          const response =  {
              "isBase64Encoded": false,
              "statusCode": 500,
              "body": JSON.stringify(error)
          };
          callback(null, response);
     });
} else {    //query one element or NEW element
  if (id !== 'NEW') {
    pool.connect().then(c => {
        client = c;
        return client.query(queryString_element);
        }).then(res => {
        client.release();
          var jsonString = res.rows[0];
          if (jsonString['id_anagrafica']) {
            form[0]['value'] = jsonString['id_anagrafica'];
          }
          if (jsonString['codice']) {
            form[1]['value'] = jsonString['codice'];
          }
          if (jsonString['nome']) {
            form[2]['value'] = jsonString['nome'];
          }
          if (jsonString['cognome']) {
            form[3]['value'] = jsonString['cognome'];
          }
          var jsonObj = JSON.stringify(form);
          var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": jsonObj,
            "isBase64Encoded": false
         };
         callback(null, response);
        });
  } else {  //NEW element
    pool.connect().then(c => {
        client = c;
        return client.query(queryString_next);
        }).then(res => {
          client.release();
          var jsonString = res.rows[0];
          form[0]['value'] = jsonString['prossimo'];
          var jsonObj = JSON.stringify(form);
          var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": jsonObj,
            "isBase64Encoded": false
          };
          callback(null, response);
        });
  }
}
}
};
