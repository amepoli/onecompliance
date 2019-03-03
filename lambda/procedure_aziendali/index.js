var processor = require('process_request');

exports.handler = function(event, context, callback) {

var codice_azienda = event.queryStringParameters.key1;
var id = event.queryStringParameters.key2;

// from this point on I try to generate the lambda in automatic

var element_form = [
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
	  inputType: 'number',
	  name: 'id_procedura',
	  value: '',
	  readonly: 'true',
	  isVisible: 'true',
	  newLine: 'true'
    },
    {
      type: 'combobox',
	  label: 'Procedura principale',
	  inputType: 'number',
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
		}, */
		{type: 'combobox',
		 label: 'frequenza',
		 inputType: 'text',
		 name: 'frequenza',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true',
		  options: [
        { id: 'Ad evento', name: 'Ad evento' }, 
        { id: 'Giornaliero', name: 'Giornaliero' }, 
        { id: 'Settimanale', name: 'Settimanale'},
        { id: 'Mensile', name: 'Mensile'},
        { id: 'Annuale', name: 'Annuale'}]
		}, 
	{
		type: 'input',
		 label: 'strumento_informatico',
		 inputType: 'text',
		 name: 'strumento_informatico',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
	}, 
	{
      type: 'combobox',
	  label: 'Centro gestionale',
	  inputType: 'multiple',
	  name: 'id_centro_gest_codice_part',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true', 
	  options: [],
	  keys: [
	  	{
	  		name: 'id_centro_gest',
	  		inputType: 'number'
	  	},
	  	{
	  		name: 'codice_part',
	  		inputType: 'text'
	  	}]
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
	  name: 'tipo_procedura',
	  inputType: 'number',
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
	  name: 'stato_attuazione',
	  inputType: 'text',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: [
        { id: 'A', name: 'Attivo' }, 
        { id: 'I', name: 'In Implementazione' }, 
        { id: 'S', name: 'Auspicabile'}]
	},
	{
      type: 'combobox',
	  label: 'Tipo processo',
	  name: 'id_tipo_processo',
	  inputType: 'number',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: []
	}
];

var search_form = [
	  {
	  	type: 'input',
	  	label: 'ID',
	  	inputType: 'number',
	  	name: 'id_procedura',
	  	value: '',
	  	readonly: 'false'
	  },
        {
      type: 'input',
      label: 'Codice',
      inputType: 'text',
      name: 'codice',
      value: '',
      readonly: 'false'
    },
    {
        type: 'input',
        label: 'Descrizione',
        inputType: 'text',
        name: 'descrizione',
        value: '',
        readonly: 'false'
      }
    ];

var subtable_form = [
    {
        label: 'Sotto Procedure',
        name: 'sotto_procedure',
        keys: ['id_procedura_parent']
    },
    {
        label: 'Rischi',
        name: 'procedure_rischi', // will be handled by risks lambda
        keys: [] // TODO
    },
    {
        label: 'Modelli di Progetto',
        name: 'procedure_modelli',          // will be handled by models lambda
        keys: [] // TODO
    }
]

var form = {
    element_form: element_form,
    search_form: search_form
};


var queries = {};

queries.list =
`SELECT codice_azienda, procedure_aziendali.id_procedura, procedure_aziendali.codice, procedure_aziendali.descrizione_breve, entrasp.centri_gestionali_descr('${codice_azienda}', procedure_aziendali.id_centro_gest) AS centro_gest
FROM entrasp.procedure_aziendali
WHERE codice_azienda='${codice_azienda}';`;

queries.element = 
`SELECT codice_azienda, id_procedura, id_procedura_parent, codice, descrizione_breve, descrizione,
id_centro_gest, tipo_procedura, stato_attuazione, id_tipo_processo 
FROM entrasp.procedure_aziendali
WHERE codice_azienda='${codice_azienda}' AND id_procedura='${id}';`;

queries.next = 
`SELECT (MAX(id_procedura)+1) as id_procedura from entrasp.procedure_aziendali WHERE codice_azienda='${codice_azienda}';`;

queries.delete = `DELETE FROM entrasp.procedure_aziendali
      WHERE codice_azienda='${codice_azienda}' AND id_procedura='${id}';`;

queries.conditions = {  // special conditions (different from key=value) for search and subtable keys
  codice: {condition: 'codice Like \'%$param%\''},
  descrizione: {condition: 'descrizione Like \'%$param%\''}
};



var body;

if ((event.httpMethod === "POST" && event.queryStringParameters.operation != 'search') || event.httpMethod === "PUT") {
  body = JSON.parse(event.body.toString());


   queries.new = `INSERT INTO entrasp.procedure_aziendali 
        (codice_azienda, id_procedura, id_procedura_parent, codice, descrizione_breve,
         descrizione, id_centro_gest, codice_part, tipo_procedura, stato_attuazione, id_tipo_processo)
        VALUES
       ('${codice_azienda}', ${body.id_procedura}, ${body.id_procedura_parent}, ${body.codice}, 
        ${body.descrizione_breve}, ${body.descrizione}, ${body.id_centro_gest_codice_part.id_centro_gest}, ${body.id_centro_gest_codice_part.codice_part}, 
        ${body.tipo_procedura},${body.stato_attuazione}, ${body.id_tipo_processo})
         RETURNING id_procedura;`;
    
    queries.update = `
         UPDATE entrasp.procedure_aziendali
         SET id_procedura_parent = ${body.id_procedura_parent},
             codice = ${body.codice},
             descrizione_breve = ${body.descrizione_breve},
             descrizione = ${body.descrizione},
             id_centro_gest = ${body.id_centro_gest_codice_part.id_centro_gest},
             codice_part =  ${body.id_centro_gest_codice_part.codice_part}, 
             tipo_procedura = ${body.tipo_procedura},
             stato_attuazione = ${body.stato_attuazione},
             id_tipo_processo = ${body.id_tipo_processo}
         WHERE codice_azienda='${codice_azienda}' AND id_procedura=${body.id_procedura};`;   
         console.log(queries.update);
}

var queryString_id_tipo_processo_cmb=`SELECT id_tipo_processo AS id, entrasp.tipo_processo_descr(id_tipo_processo, codice_azienda) AS name  FROM entrasp.tipi_processi WHERE codice_azienda='${codice_azienda}';`;	
var queryString_id_centro_gest_cmb=`SELECT id_centro_gest || '££' || codice_part AS id, entrasp.centri_gestionali_descr(codice_part,id_centro_gest) AS name  FROM entrasp.centri_gestionali WHERE codice_part='${codice_azienda}';`;
var queryString_id_procedura_parent_cmb=`SELECT id_procedura AS id, entrasp.procedure_aziendali_descr(id_procedura, codice_azienda) AS name  FROM entrasp.procedure_aziendali WHERE codice_azienda='${codice_azienda}';`;

queries.combo = [
  {
    queryString: queryString_id_tipo_processo_cmb,
    name: 'id_tipo_processo'
  },
  {
    queryString: queryString_id_centro_gest_cmb,
    name: 'id_centro_gest_codice_part'
  },
  {
    queryString: queryString_id_procedura_parent_cmb,
    name: 'id_procedura_parent'
  }
];


var ret_callback = function(return_value) {
    console.log(return_value.status);
    callback(null, return_value.response);
  };
  
processor.process_request(event, context, form, queries, ret_callback);
  
};
