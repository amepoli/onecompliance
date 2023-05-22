import axios, { AxiosError } from 'axios';
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

async function axiosError(error: { response: { data: any; status: any; headers: any; }; request: any; message: any; config: any; }) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
    }
    console.log(error.config);
};

exports.handler = async (event) => {

    console.log('event: ', event);

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

        await axios.get(`http://109.123.241.212/auth/login?username=${username}&password=${password}`)
            .then(function (tokenResponse) {
                response = tokenResponse;
            })
            .catch(function (error) {
                axiosError(error);
            });

        const authToken = response.data.access_token;

        // console.log('authToken: ', authToken);

        const postData = event;

        // // Effettua la richiesta POST utilizzando i dati e l'header appena creati
        await axios.post('http://109.123.241.212/api/products/new/',
            postData,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(function (postResponse) {
                console.log(postResponse);
            })
            .catch(function (error) {
                axiosError(error);
            });

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