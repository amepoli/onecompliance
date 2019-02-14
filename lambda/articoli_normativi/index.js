var processor = require('process_request');

exports.handler = function(event, context, callback) {

var id_testo_normativo = event.queryStringParameters.key1;
var codice_articolo_normativo = event.queryStringParameters.key2;


// from this point on I try to generate the lambda in automatic

var form = [
		
		{type: 'combobox',
		 label: 'Testo Normativo',
		 inputType: 'text',
		 name: 'id_testo_normativo',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true',
		 options: []
		}, 
		{type: 'input',
		 label: 'Codice articolo',
		 inputType: 'text',
		 name: 'codice_articolo_normativo',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		}, 
		{type: 'textarea',
		 label: 'Rubrica',
		 inputType: 'text',
		 name: 'rubrica',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		}, 
		{type: 'textarea',
		 label: 'Testo articolo',
		 inputType: 'text',
		 name: 'descrizione',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true',
		 validations: [
					{
					name: 'required',
					validator: 'Validators.required',
					message: 'Codice mancante'
					}
					]
		}, 
		{type: 'combobox',
		 label: 'Art. 231 di riferimento',
		 inputType: 'text',
		 name: 'articolo_normativo_parent',
		 value: '',
		 readonly: 'false',
		 isVisible: 'false',
		 newLine: 'true',
		 options: []
		}, 
		{type: 'input',
		 label: 'note',
		 inputType: 'text',
		 name: 'note',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		}, 
		{type: 'input',
		 label: 'Sanzione amm. Min quote',
		 inputType: 'text',
		 name: 'sanz_amm_min_quote',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'false'
		}, 
		{type: 'input',
		 label: 'Max quote',
		 inputType: 'text',
		 name: 'sanz_amm_max_quote',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true',
		}, 
		{type: 'input',
		 label: 'Sanzione int. Min',
		 inputType: 'text',
		 name: 'sanz_int_min',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'false'
		}, 
		{type: 'input',
		 label: 'Max',
		 inputType: 'text',
		 name: 'sanz_int_max',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		}
	];


   
//primi campi le chiavi primarie secondo l'ordine di cui alle righe 21 e 22, poi i nomi dei soli campi da visualizzare con le funzioni con un AS
    
var queries = {};

queries.list =`SELECT id_testo_normativo, codice_articolo_normativo, entrasp.testi_normativi_rif_descr(id_testo_normativo) AS testo_normativo, rubrica FROM entrasp.articoli_normativi;`;

queries.element =`SELECT id_testo_normativo, codice_articolo_normativo, rubrica, descrizione, codice_articolo_normativo_parent || '££' || id_testo_normativo_parent AS articolo_normativo_parent, note, sanz_amm_min_quote, sanz_amm_max_quote, sanz_int_min, sanz_int_max FROM entrasp.articoli_normativi WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`;


/* XXX Messaggio temporaneo per NIcola XXXX QUesta var che segue dobbiamo discuterla. 
E' un combobox che dovrebbe automaticamente derivare dalla scelta fatta sul combobox  codice_articolo_normativo_parent.*/

var queryString_id_testo_normativo_cmb=`SELECT id_testo_normativo AS id, entrasp.testi_normativi_rif_descr(id_testo_normativo) AS name  FROM entrasp.testi_normativi;`;
var queryString_articolo_normativo_parent_cmb=`SELECT codice_articolo_normativo || '££' || id_testo_normativo AS id, entrasp.articoli_normativi_cod_rub(codice_articolo_normativo, id_testo_normativo) AS name FROM entrasp.articoli_normativi;`;

queries.combo = [
  {
    queryString: queryString_id_testo_normativo_cmb,
    name: 'id_testo_normativo'
  },
  {
    queryString: queryString_articolo_normativo_parent_cmb,
    name: 'articolo_normativo_parent'
  }
];

queries.delete =
`DELETE FROM entrasp.articoli_normativi WHERE id_testo_normativo='${id_testo_normativo}' AND codice_articolo_normativo='${codice_articolo_normativo}';`;	

var body;

if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
   body = JSON.parse(event.body.toString()); // drove me crazy!!!!

// Please note the difference between processing numeric or string types of selected choices
//var id_testo_normativo_parent = body.id_testo_normativo_parent ? `'${body.id_testo_normativo_parent.id}'` : null;
var note = body.note ? `'${body.note}'` : null;
//var rif_esterno_url = body.rif_esterno_url ? `'${body.rif_esterno_url}'` : null;
id_testo_normativo = body.id_testo_normativo ? `'${body.id_testo_normativo.id}'` : id_testo_normativo;
//var codice_articolo_normativo_parent = body.codice_articolo_normativo_parent ? `'${body.codice_articolo_normativo_parent.id}'` : null;
codice_articolo_normativo = body.codice_articolo_normativo ? `'${body.codice_articolo_normativo}'` : codice_articolo_normativo;
var rubrica = body.rubrica ? `'${body.rubrica}'` : null;
var descrizione = body.descrizione ? `${body.descrizione}` : null;
if (descrizione) descrizione = '\'' + descrizione.replace(/'/g, "''") + '\''; //add external quotes and replace internal single quotes with two quotes (Postgres syntax)
var sanz_amm_min_quote = body.sanz_amm_min_quote ? `'${body.sanz_amm_min_quote}'` : null;
var sanz_amm_max_quote = body.sanz_amm_max_quote ? `'${body.sanz_amm_max_quote}'` : null;
var sanz_int_min = body.sanz_int_min ? `'${body.sanz_int_min}'` : null;
var sanz_int_max = body.sanz_int_max ? `'${body.sanz_int_max}'` : null;
   
queries.new = `INSERT INTO entrasp.articoli_normativi
(note, id_testo_normativo, codice_articolo_normativo, rubrica, descrizione, sanz_amm_min_quote, sanz_amm_max_quote, sanz_int_min, sanz_int_max)
Values
(${note}, ${id_testo_normativo}, ${codice_articolo_normativo}, ${rubrica}, ${descrizione}, ${sanz_amm_min_quote}, ${sanz_amm_max_quote}, ${sanz_int_min}, ${sanz_int_max});`;	

queries.update =`UPDATE entrasp.articoli_normativi
SET note=${note}, rubrica=${rubrica}, descrizione=${descrizione}, sanz_amm_min_quote=${sanz_amm_min_quote}, sanz_amm_max_quote=${sanz_amm_max_quote}, sanz_int_min=${sanz_int_min}, sanz_int_max=${sanz_int_max}
WHERE id_testo_normativo=${id_testo_normativo} AND codice_articolo_normativo=${codice_articolo_normativo};`;
console.log(queries.update);   
}

var ret_callback = function(return_value) {
  console.log(return_value.status);
  callback(null, return_value.response);
};

processor.process_request(event, context, form, queries, ret_callback);

};
