var processor = require('process_request');

exports.handler = function(event, context, callback) {

var codice_azienda = event.queryStringParameters.key1;
var id = event.queryStringParameters.key2;

// from this point on I try to generate the lambda in automatic

var form = [
	{
      type: 'input',
	  label: 'Codice azienda',
      inputType: 'text',
	  name: 'codice_azienda',
	  value: '',
	  readonly: 'true',
	  isVisible: 'false',
	  newLine: 'true'
    },
    {
      type: 'input',
      label: 'ID procedura',
	  inputType: 'text',
	  name: 'id_procedura',
	  value: '',
	  readonly: 'true',
	  isVisible: 'true',
	  newLine: 'true'
    },
    {
      type: 'combobox',
	  label: 'Procedura principale',
	  inputType: 'text',
	  name: 'id_procedura_parent',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: []
	},
	{
      type: 'input',
	  label: 'Codice',
	  inputType: 'text',
	  name: 'codice',
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
    {
      type: 'input',
	  label: 'Descrizione breve',
	  inputType: 'text',
	  name: 'descrizione_breve',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  validations: [
		  {
		    name: 'required',
		    validator: 'Validators.required',
		    message: 'Descrizione mancante'
		  },
	      {
	        name: 'pattern',
	        validator: '^[a-zA-Z1-9&_,.;: ]+$',
	        message: 'Uso caratteri non ammessi'
	      }   
	  ]
    },
    {
      type: 'textarea',
	  label: 'Descrizione',
	  inputType: 'text',
	  name: 'descrizione',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  validations: [{
		  name: 'required',
		  validator: 'Validators.required',
		  message: 'Descrizione mancante'
	  }]
    },
	/*	{
      type: 'input',
		  label: 'ordinamento',
		  inputType: 'text',
		  name: 'ordinamento',
		  value: '',
		  readonly: 'false',
		  isVisible: 'true',
		  newLine: 'true'
  }, 
		{type: 'input',
		 label: 'tree_path',
		 inputType: 'text',
		 name: 'tree_path',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		},
		{type: 'input',
		 label: 'frequenza',
		 inputType: 'text',
		 name: 'frequenza',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		},
		{type: 'input',
		 label: 'strumento_informatico',
		 inputType: 'text',
		 name: 'strumento_informatico',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		}, */
	{
      type: 'combobox',
	  label: 'Centro gestionale',
	  inputType: 'text',
	  name: 'id_centro_gest',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true', 
	  options: []
    },
	/*	{type: 'input',
		 label: 'codice_part',
		 inputType: 'text',
		 name: 'codice_part',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		},*/
	{
      type: 'combobox',
	  label: 'Tipo procedura',
	  inputType: 'text',
	  name: 'tipo_procedura',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: [
        { id: '0', name: 'Procedura normale' }, 
        { id: '1', name: 'Presidio' }, 
        { id: '2', name: 'Procedura e presidio'}]
	},
	{
      type: 'combobox',
	  label: 'Stato attuazione',
	  inputType: 'text',
	  name: 'stato_attuazione',
	  value: '3',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: [
        { id: '0', name: 'Attivo' }, 
        { id: '1', name: 'In Implementazione' }, 
        { id: '2', name: 'Auspicabile'},
        { id: '3', name: 'Non valorizzato'}]
	},
	{
      type: 'combobox',
	  label: 'Tipo processo',
	  inputType: 'text',
	  name: 'id_tipo_processo',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: []
	}
];


var queries = {};

queries.list =
`SELECT codice_azienda, procedure_aziendali.id_procedura, procedure_aziendali.codice, procedure_aziendali.descrizione_breve, entrasp.centri_gestionali_descr('${codice_azienda}',procedure_aziendali.id_centro_gest) AS centro_gest
FROM entrasp.procedure_aziendali
WHERE codice_azienda='${codice_azienda}'; `

queries.element = 
`SELECT codice_azienda,id_procedura,id_procedura_parent,codice,descrizione_breve,descrizione,
id_centro_gest,tipo_procedura,stato_attuazione,id_tipo_processo 
FROM entrasp.procedure_aziendali
WHERE codice_azienda='${codice_azienda}' AND id_procedura='${id}';`

var queryString_procedura_parent_cmb =
`SELECT id_procedura AS id, descrizione_breve AS name from entrasp.procedure_aziendali WHERE codice_azienda='${codice_azienda}';`

var queryString_centro_gest_cmb=
`SELECT id_centro_gest AS id, descrizione AS name from entrasp.centri_gestionali WHERE codice_part='${codice_azienda}';`

var queryString_tipo_processo_cmb=
`SELECT id_tipo_processo AS id, descrizione AS name from entrasp.tipi_processi WHERE codice_azienda='${codice_azienda}';`

queries.combo = [
    {
      queryString: queryString_procedura_parent_cmb,
      name: 'id_procedura_parent'
    },
    {
      queryString: queryString_centro_gest_cmb,
      name: 'id_centro_gest'
    },
    {
      queryString: queryString_tipo_processo_cmb,
      name: 'id_tipo_processo'
    }
];

queries.next = 
`SELECT (MAX(id_procedura)+1) as id_procedura from entrasp.procedure_aziendali WHERE codice_azienda='${codice_azienda}';`

queries.delete = `DELETE FROM entrasp.procedure_aziendali
      WHERE codice_azienda='${codice_azienda}' AND id_procedura='${id}';`;

var body;

if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
   body = JSON.parse(event.body.toString()); // drove me crazy!!!!

   // Check of non null value needed for all combo box selected choices
   // Please note the difference between processing numeric or string types of selected choices
   var id_procedura_parent = body.id_procedura_parent.id ? `'${body.id_procedura_parent.id}'` : null;
   var id_centro_gest = body.id_centro_gest.id ? body.id_centro_gest.id : null;
   var stato_attuazione = body.stato_attuazione.id ? `'${body.stato_attuazione.id}'` : null;
   var tipo_procedura = body.tipo_procedura.id ? `'${body.tipo_procedura.id}'` : null;
   var id_tipo_processo = body.id_tipo_processo.id ? `'${body.id_tipo_processo.id}'` : null;
   
   
   queries.new = `INSERT INTO entrasp.procedure_aziendali 
        (codice_azienda, id_procedura, id_procedura_parent, codice, descrizione_breve,
         descrizione, id_centro_gest, tipo_procedura, stato_attuazione, id_tipo_processo)
        VALUES
       ('${codice_azienda}', ${body.id_procedura}, ${id_procedura_parent}, '${body.codice}', 
        '${body.descrizione_breve}', '${body.descrizione}', ${id_centro_gest}, 
        ${tipo_procedura},${stato_attuazione}, ${id_tipo_processo})
         RETURNING id_procedura;`;
    
    queries.update = `
         UPDATE entrasp.procedure_aziendali
         SET id_procedura_parent = ${id_procedura_parent},
             codice = '${body.codice}',
             descrizione_breve = '${body.descrizione_breve}',
             descrizione = '${body.descrizione}',
             id_centro_gest = ${id_centro_gest},
             tipo_procedura = ${tipo_procedura},
             stato_attuazione = ${stato_attuazione},
             id_tipo_processo = ${id_tipo_processo}
         WHERE codice_azienda='${codice_azienda}' AND id_procedura='${body.id_procedura}';`;   
}

var ret_callback = function(return_value) {
    console.log(return_value.status);
    callback(null, return_value.response);
  };
  
processor.process_request(event, context, form, queries, ret_callback);
  
};
