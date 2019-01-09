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

// from this point on I try to generate the lambda in automatic

    

var form = [
		{type: 'comboBox',
		 label: 'id_testo_normativo_parent',
		 inputType: 'text',
		 name: 'id_testo_normativo_parent',
		 value: '',
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
		{type: 'comboBox',
		 label: 'Testo normativo',
		 inputType: 'text',
		 name: 'id_testo_normativo',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'True'
		}, 
		{type: 'comboBox',
		 label: 'Articolo parent',
		 inputType: 'text',
		 name: 'codice_articolo_normativo_parent',
		 value: '',
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
		{type: 'textArea',
		 label: 'Rubrica',
		 inputType: 'text',
		 name: 'rubrica',
		 value: '',
		 readonly: 'true',
		 isVisible: 'true',
		 newLine: 'True'
		}, 
		{type: 'textArea',
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

var queryString=`SELECT entrasp.testi_normativi_rif_descr(${body['id_testo_normativo_parent']}), note, rif_esterno_url, entrasp.articoli_normativi_rub_descr(${body['codice_articolo_normativo_parent']}), rubrica, descrizione, sanz_amm_min_quote, sanz_amm_max_quote, sanz_int_min, sanz_int_max FROM entrasp.articoli_normativi;`	

var queryString_element=`SELECT id_testo_normativo_parent, note, rif_esterno_url, codice_articolo_normativo_parent, rubrica, descrizione, sanz_amm_min_quote, sanz_amm_max_quote, sanz_int_min, sanz_int_max FROM entrasp.articoli_normativi WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`

var queryString_id_testo_normativo_parent_cmb=
`SELECT entrasp.testi_normativi_rif_descr(${body['id_testo_normativo_parent']}) FROM articoli_normativi;`	

var queryString_id_testo_normativo_cmb=`SELECT entrasp.testi_normativi_rif_descr(${body['id_testo_normativo']}) FROM articoli_normativi;`	

var queryString_codice_articolo_normativo_parent_cmb=`SELECT entrasp.articoli_normativi_rub_descr(${body['codice_articolo_normativo_parent']}) FROM articoli_normativi;`

var queryString_next = 
`SELECT (MAX(id_procedura)+1) as prossimo from entrasp.procedure_aziendali WHERE codice_azienda='${codice_part}';`

var deleteString=
`DELETE FROM entrasp.articoli_normativi WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`	

var body;

    
if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
   body = JSON.parse(event.body.toString()); // drove me crazy!!!!

// Please note the difference between processing numeric or string types of selected choices
var id_testo_normativo_parent=body.id_testo_normativo_parent?`'${body.id_testo_normativo_parent.id}'` : null;
var note=body.note?`'${body.note.id}'` : null;
var rif_esterno_url=body.rif_esterno_url?`'${body.rif_esterno_url.id}'` : null;
var id_testo_normativo=body.id_testo_normativo?`'${body.id_testo_normativo.id}'` : null;
var codice_articolo_normativo_parent=body.codice_articolo_normativo_parent?`'${body.codice_articolo_normativo_parent.id}'` : null;
var codice_articolo_normativo=body.codice_articolo_normativo?`'${body.codice_articolo_normativo.id}'` : null;
var rubrica=body.rubrica?`'${body.rubrica.id}'` : null;
var sanz_amm_min_quote=body.sanz_amm_min_quote?`'${body.sanz_amm_min_quote.id}'` : null;
var sanz_int_min=body.sanz_int_min?`'${body.sanz_int_min.id}'` : null;
var sanz_int_max=body.sanz_int_max?`'${body.sanz_int_max.id}'` : null;
   
var insertNewString=`INSERT INTO entrasp.articoli_normativi
(id_testo_normativo_parent, note, rif_esterno_url, id_testo_normativo, codice_articolo_normativo_parent, codice_articolo_normativo, rubrica, descrizione, sanz_amm_min_quote, sanz_amm_max_quote, sanz_int_min, sanz_int_max)
Values
('${body[id_testo_normativo_parent]}', '${body[note]}', '${body[rif_esterno_url]}', '${id_testo_normativo}', '${body[codice_articolo_normativo_parent]}', '${codice_articolo_normativo}', '${body[rubrica]}', '${descrizione}', '${body[sanz_amm_min_quote]}', '${sanz_amm_max_quote}', '${body[sanz_int_min]}', '${body[sanz_int_max]}')
RETURNING id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`"	

var updateString=`UPDATE entrasp.articoli_normativi
SET id_testo_normativo_parent=${body[id_testo_normativo_parent]}, note='${body[note]}', rif_esterno_url='${body[rif_esterno_url]}', codice_articolo_normativo_parent='${body[codice_articolo_normativo_parent]}', rubrica='${body[rubrica]}', descrizione='${descrizione}', sanz_amm_min_quote='${body[sanz_amm_min_quote]}', sanz_amm_max_quote='${sanz_amm_max_quote}', sanz_int_min='${body[sanz_int_min]}', sanz_int_max='${body[sanz_int_max]}'
WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`	
   
}

if (event.httpMethod === "POST") {
  console.log(body);
  console.log(updateString);
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
  if (id === '') { // query the full table
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
      return client.query(queryString_procedura_parent_cmb);
  }).then(res => {
    client.release();
    form[2]['options']=res.rows;
    pool.connect().then(c => {
      client = c;
      return client.query(queryString_centro_gest_cmb);
    }).then(res => {
      client.release();
      form[6]['options']=res.rows;
      pool.connect().then(c => {
      client = c;
      return client.query(queryString_tipo_processo_cmb);
    }).then(res => {
      client.release();
      form[9]['options']=res.rows;
      // unrolling of combo box values finishes here
      if (id !== 'NEW') {  // existing element
        pool.connect().then(c => {
        client = c;
        return client.query(queryString_element);
        }).then(res => {
        client.release();
          var jsonString = res.rows[0];
          if (jsonString['codice_azienda']) {
            form[0]['value'] = jsonString['codice_azienda'];
          }
          if (jsonString['id_procedura']) {
            form[1]['value'] = jsonString['id_procedura'];
          }
          if (jsonString['id_procedura_parent']) {
            form[2]['value'] = jsonString['id_procedura_parent'];
          }
          if (jsonString['codice']) {
            form[3]['value'] = jsonString['codice'];
          }
          if (jsonString['descrizione_breve']) {
            form[4]['value'] = jsonString['descrizione_breve'];
          }
          if (jsonString['descrizione']) {
            form[5]['value'] = jsonString['descrizione'];
          }
          if (jsonString['id_centro_gest']) {
            form[6]['value'] = jsonString['id_centro_gest'];
          }
          if (jsonString['tipo_procedura']) {
            form[7]['value'] = jsonString['tipo_procedura'];
          }
          if (jsonString['stato_attuazione']) {
            form[8]['value'] = jsonString['stato_attuazione'];
          }
          if (jsonString['id_tipo_processo']) {
            form[9]['value'] = jsonString['id_tipo_processo'];
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
            form[0]['value'] = codice_part;
            form[1]['value'] = jsonString['prossimo'];
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
      });
    });
   });
}
}
};
