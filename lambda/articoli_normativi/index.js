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

    

var id_testo_normativo = event.queryStringParameters.key1;
var codice_articolo_normativo = event.queryStringParameters.key2;
var operation = event.queryStringParameters.operation;  // list, select or create

// from this point on I try to generate the lambda in automatic

   
var form = [
		{type: 'combobox',
		 label: 'id_testo_normativo_parent',
		 inputType: 'text',
		 name: 'id_testo_normativo_parent',
         value: '',
         options: [],
		 readonly: 'false',
		 isVisible: 'false',
		 newLine: 'True'
		}, 
		{type: 'text',
		 label: 'note',
		 inputType: 'text',
		 name: 'note',
		 value: '',
		 readonly: 'false',
		 isVisible: 'false',
		 newLine: 'True'
		}, 
		{type: 'text',
		 label: 'rif_esterno_url',
		 inputType: 'text',
		 name: 'rif_esterno_url',
		 value: '',
		 readonly: 'false',
		 isVisible: 'false',
		 newLine: 'True'
		}, 
		{type: 'combobox',
		 label: 'Testo normativo',
		 inputType: 'text',
		 name: 'id_testo_normativo',
         value: '',
         options: [],
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'True'
		}, 
		{type: 'combobox',
		 label: 'Articolo padre',
		 inputType: 'text',
		 name: 'codice_articolo_normativo_parent',
         value: '',
         options: [],
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'True'
		}, 
		{type: 'text',
		 label: 'Codice articolo',
		 inputType: 'text',
		 name: 'codice_articolo_normativo',
		 value: '',
		 readonly: 'true',
		 isVisible: 'false',
		 newLine: 'True'
		}, 
		{type: 'textarea',
		 label: 'Rubrica',
		 inputType: 'text',
		 name: 'rubrica',
		 value: '',
		 readonly: 'true',
		 isVisible: 'true',
		 newLine: 'True'
		}, 
		{type: 'textarea',
		 label: 'Testo articolo',
		 inputType: 'text',
		 name: 'descrizione',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'True',
		 validations: [
					{
					name: 'required',
					validator: 'Validators.required',
					message: 'Codice mancante'
					},
					{
					name: 'pattern',
					validator: '^[a-zA-Z1-9&_ ]+$',
					message: 'Uso caratteri non ammessi'
					}
					]
		}, 
		{type: 'text',
		 label: 'Sanzione amm. Min quote',
		 inputType: 'text',
		 name: 'sanz_amm_min_quote',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'False'
		}, 
		{type: 'text',
		 label: 'Max quote',
		 inputType: 'text',
		 name: 'sanz_amm_max_quote',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'True',
		 validations: [
					{
					name: 'required',
					validator: 'Validators.required',
					message: 'Descrizione mancante'
					}
					]
		}, 
		{type: 'text',
		 label: 'Sanzione int. Min',
		 inputType: 'text',
		 name: 'sanz_int_min',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'False'
		}, 
		{type: 'text',
		 label: 'Max',
		 inputType: 'text',
		 name: 'sanz_int_max',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'True'
		}
	];

//primi campi le chiavi primarie secondo l'ordine di cui alle righe 21 e 22, poi i nomi dei soli campi da visualizzare con le funzioni con un AS
    
var queryString=`SELECT id_testo_normativo, codice_articolo_normativo, entrasp.testi_normativi_rif_descr(id_testo_normativo) AS testo_normativo, rubrica FROM entrasp.articoli_normativi;`;

var queryString_element=`SELECT entrasp.testi_normativi_rif_descr(id_testo_normativo_parent) AS testo_normativo_parent, note, rif_esterno_url, entrasp.testi_normativi_rif_descr(id_testo_normativo) AS Testo_normativo, entrasp.articoli_normativi_rub_descr(codice_articolo_normativo_parent) AS Articolo_normativo_parent, codice_articolo_normativo, rubrica, descrizione, sanz_amm_min_quote, sanz_amm_max_quote, sanz_int_min, sanz_int_max FROM entrasp.articoli_normativi WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`;

/* XXX Messaggio temporaneo per NIcola XXXX QUesta var che segue dobbiamo discuterla. 
E' un combobox che dovrebbe automaticamente derivare dalla scelta fatta sul combobox  codice_articolo_normativo_parent.*/

/* var queryString_id_testo_normativo_parent_cmb=`SELECT id_testo_normativo_parent AS id, entrasp.testi_normativi_rif_descr(id_testo_normativo_parent) AS name FROM entrasp.articoli_normativi;`; */	

var queryString_id_testo_normativo_cmb=`SELECT id_testo_normativo AS id, entrasp.testi_normativi_rif_descr(id_testo_normativo) AS testo_normativo FROM entrasp.testi_normativi;`;	
var queryString_codice_articolo_normativo_parent_cmb=`SELECT codice_articolo_normativo AS id, entrasp.articoli_normativi_cod_rub(codice_articolo_normativo) AS codice_articolo FROM entrasp.articoli_normativi;`;

var deleteString=
`DELETE FROM entrasp.articoli_normativi WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`;	

var body;

    
if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
   body = JSON.parse(event.body.toString()); // drove me crazy!!!!

// Please note the difference between processing numeric or string types of selected choices
var id_testo_normativo_parent = body.id_testo_normativo_parent ? `'${body.id_testo_normativo_parent.id}'` : null;
var note = body.note ? `'${body.note}'` : null;
var rif_esterno_url = body.rif_esterno_url ? `'${body.rif_esterno_url}'` : null;
id_testo_normativo = body.id_testo_normativo ? `'${body.id_testo_normativo.id}'` : id_testo_normativo;
var codice_articolo_normativo_parent = body.codice_articolo_normativo_parent ? `'${body.codice_articolo_normativo_parent.id}'` : null;
codice_articolo_normativo = body.codice_articolo_normativo ? `'${body.codice_articolo_normativo}'` : codice_articolo_normativo;
var rubrica = body.rubrica ? `'${body.rubrica}'` : null;
var descrizione = body.descrizione ? `'${body.descrizione}'` : null;
var sanz_amm_min_quote = body.sanz_amm_min_quote ? `'${body.sanz_amm_min_quote}'` : null;
var sanz_amm_max_quote = body.sanz_amm_max_quote ? `'${body.sanz_amm_max_quote}'` : null;
var sanz_int_min = body.sanz_int_min ? `'${body.sanz_int_min}'` : null;
var sanz_int_max = body.sanz_int_max ? `'${body.sanz_int_max}'` : null;
   
var insertNewString=`INSERT INTO entrasp.articoli_normativi
(id_testo_normativo_parent, note, rif_esterno_url, id_testo_normativo, codice_articolo_normativo_parent, codice_articolo_normativo, rubrica, descrizione, sanz_amm_min_quote, sanz_amm_max_quote, sanz_int_min, sanz_int_max)
Values
('${id_testo_normativo_parent}', '${note}', '${rif_esterno_url}', '${id_testo_normativo}', '${codice_articolo_normativo_parent}', '${codice_articolo_normativo}', '${rubrica}', '${descrizione}', '${sanz_amm_min_quote}', '${sanz_amm_max_quote}', '${sanz_int_min}', '${sanz_int_max}')
RETURNING id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`;	

var updateString=`UPDATE entrasp.articoli_normativi
SET id_testo_normativo_parent=${id_testo_normativo_parent}, note='${note}', rif_esterno_url='${rif_esterno_url}', codice_articolo_normativo_parent='${codice_articolo_normativo_parent}', rubrica='${rubrica}', descrizione='${descrizione}', sanz_amm_min_quote='${sanz_amm_min_quote}', sanz_amm_max_quote='${sanz_amm_max_quote}', sanz_int_min='${sanz_int_min}', sanz_int_max='${sanz_int_max}'
WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`	
   
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
  if (operation === 'list') { // query the full table
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
  // start unrolling all combo box values
  pool.connect().then(c => {
      client = c;
      return client.query(queryString_id_testo_normativo_parent_cmb);
  }).then(res => {
    client.release();
    form[0]['options']=res.rows;
    pool.connect().then(c => {
      client = c;
      return client.query(queryString_id_testo_normativo_cmb);
    }).then(res => {
      client.release();
      form[3]['options']=res.rows;
      pool.connect().then(c => {
      client = c;
      return client.query(queryString_codice_articolo_normativo_parent_cmb);
    }).then(res => {
      client.release();
      form[4]['options']=res.rows;
      // unrolling of combo box values finishes here
      if (operation === 'select') { //query one element
        pool.connect().then(c => {
        client = c;
        return client.query(queryString_element);
        }).then(res => {
        client.release();
          var jsonString = res.rows[0];
          var i = 0;
          for (let element in form) {
              if (jsonString[element.name]) {
                  form[i++]['value'] = jsonString[element.name];
              }
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
      } else {  // operation == 'create' --> NEW element
            var jsonObj = JSON.stringify(form);
            var response = {
              "statusCode": 200,
              "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
              "body": jsonObj,
              "isBase64Encoded": false
            };
            callback(null, response);
      }
      });
    });
   });
}
}
};
