var http = require("http");

const url = "http://localhost:8080/json";
const company = "RICREATIVO";
const username = '';
const idAnagrafica = '';
const queryString = "select codice_azienda, id_procedura, entrasp.attivita_a_rischio (id_procedura, codice_azienda) as attivita,  entrasp.tipologie_reato_processo (id_procedura, codice_azienda) as reato,  entrasp.centri_gestionali_coinvolti_processo (id_procedura, codice_azienda) as centri_gest, entrasp.descrizione_attivita_a_rischio (id_procedura, codice_azienda) as descrizione, 	descrizione_breve from entrasp.procedure_aziendali where codice_azienda='RICREATIVO' 	and id_procedura_parent is null";
const reportName = "modello_231_lottomatica_prova";
const mainQuery = { name: reportName, query: queryString };
const jsonParams = {
    // json: {
        mainReport: {
            name: mainQuery.name,
            query: mainQuery.query,
        },
        subReports: [],
        params: [
            { "key": "codice_azienda", "value": company },
            { "key": "global_username", "value": username },
            { "key": "global_userid", "value": idAnagrafica },
            { "key": "db_host", "value": "occdkstackdev-1-auroraclusterfromsnapshotinstance1-za8wub0tpsev.caxbbckt9xen.eu-central-1.rds.amazonaws.com" },
            { "key": "db_name", "value": "onecompliance" },
            { "key": "db_user", "value": "onecompliance_app" },
            { "key": "db_password", "value": "vE5AjnN!0k?G" }
        ]
    // }
};


// Create an options object
const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/json',
    method: 'POST',
    headers: {
    //   'Content-Type': 'application/json',
      'User-Agent': 'Node.js'
    }
  };

const getURLFromServer = async () => { //mainQuery, company, username, idAnagrafica) => {

    // console.log(JSON.stringify(jsonParams));
    // console.log('URL: ', url);

    // var res = await request('POST', url, jsonParams);

    // return res.getBody('utf8');

    try {

        const request = http.request(options, (response) => {
            // Initialize a variable to store the response data
            let data = '';
          
            // Listen to the data event
            response.on('data', (chunk) => {
              // Append the chunk to the data variable
              data += chunk.toString();
            });
          
            // Listen to the end event
            response.on('end', () => {
              // Log the status code and the headers
              console.log(`Status code: ${response.statusCode}`);
              console.log(`Headers: ${JSON.stringify(response.headers)}`);
          
              // Parse the data as JSON
              const post = JSON.parse(data);
          
              // Log the post information
              console.log(`Post ID: ${post.id}`);
              console.log(`Post Title: ${post.title}`);
              console.log(`Post Body: ${post.body}`);
              console.log(`Post User ID: ${post.userId}`);
            });
          
            // Listen to the error event
            response.on('error', (error) => {
              // Throw the error
              throw error;
            });
          });
      // Write the data to the request object
      request.write(JSON.stringify(jsonParams));
      
      // End the request object
      request.end();
      }
      catch(e) {
        console.error(e);
      }

}


// Create a request object

  
  

// const test = async ()=> {
    
//     const url = getURLFromServer(mainQuery, company, username = '', idUserAnagrafica = '');
//     console.log(url);
// }

// test();

getURLFromServer();
