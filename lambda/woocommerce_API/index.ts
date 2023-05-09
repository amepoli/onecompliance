import axios from 'axios';
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

exports.handler = async() => {

    try {

        const secret_name = process.env.SECRET_NAME; //"WooCommerce_API";
        
        const client = new SecretsManagerClient({
            region: process.env.REGION,
        });

        let response;

        try {
            response = await client.send(
                new GetSecretValueCommand({
                    SecretId: secret_name,
                    VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
                })
            );
        } catch (error) {
            // For a list of exceptions thrown, see
            // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
            throw error;
        }

        const secret = response.SecretString;
        
        const username = JSON.parse(secret).username;
        const password = JSON.parse(secret).password;
        
        response = await axios.get(`http://109.123.241.212/auth/login?username=${username}&password=${password}`);
        const authToken = response.data.access_token;

        console.log('authToken: ', authToken);

        // // Costruisce l'oggetto dati da inviare nella richiesta POST
        // const postData = {
        //     field1: 'value1',
        //     field2: 'value2'
        // };

        // // Aggiunge il token di autenticazione all'header della richiesta POST
        // const headers = {
        //     Authorization: `Bearer ${authToken}`
        // };

        // // Effettua la richiesta POST utilizzando i dati e l'header appena creati
        // const postResponse = await axios.post('https://example.com/api', postData, { headers });

        return {
            statusCode: 200,
            body: JSON.stringify('OK')
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ message: error.message })
        };
    }

};