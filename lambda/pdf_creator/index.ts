const AWS = require('aws-sdk');
// import * as Pool from 'pg-pool';
import puppeteer from 'puppeteer-core';
const chromium = require("@sparticuz/chromium");

AWS.config.update({ region: process.env.REGION });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// const pool = new Pool({
//     host: process.env.HOST_NAME,
//     database: process.env.DB_NAME,
//     user: process.env.USER_NAME,
//     password: process.env.PASSWORD,
//     port: process.env.PORT,
//     max: 1,
//     min: 0,
//     idleTimeoutMillis: 300000,
//     connectionTimeoutMillis: 1000
// });

const default_separator_out = ';';
const default_bucket_name = 'BUCKET_NAME';
const default_company = 'DEMO';
const default_folder = 'test';
const default_file_out = 'test_csv_creator.csv';

const default_query = 'SELECT 1 AS one,2 AS two,3 AS three';

var csvFile = '';

exports.handler = async (event) => {

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;

    console.log(queryParams);

    let body = { result: 'OK' };

    let template = `
    <!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Questionario</title>
    <style>header {
        background-color: #007bff;
        padding: 10px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      header img {
        height: 50px;
      }
      
      header a {
        text-decoration: none;
        color: #fff;
        font-size: 20px;
      }
      
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: #333;
        margin: 0;
        padding: 0;
      }
      
      h1 {
        font-size: 18px;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .question-container {
        width: 80%;
        margin: auto;
      }
      
      .question-box {
        margin-bottom: 20px;
        border: 1px solid #c7c7c7;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
        background-color: #f7f7f7;
      }
      
      .question-box label {
        display: block;
        margin-bottom: 10px;
      }
      
      .question-box input[type="radio"],
      .question-box input[type="checkbox"] {
        margin-right: 10px;
      }
      
      button {
        display: block;
        margin-top: 20px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        color: #fff;
        background-color: #007bff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .barra {
        background: linear-gradient(to right, #00ff00, #ffff00, #ffa500, #ff0000);
        height: 30px;
        border-radius: 10px;
        margin-bottom: 10px;
        position: relative;
      }
      
      .sezione {
        height: 100%;
        position: absolute;
        top: 0;
      }
      
      .verde {
        width: 20%;
      }
      
      .giallo-chiaro {
        width: 20%;
        left: 20%;
      }
      
      .giallo {
        width: 20%;
        left: 40%;
      }
      
      .arancione {
        width: 20%;
        left: 60%;
      }
      
      .rosso {
        width: 20%;
        left: 80%;
      }
      
      .descrizione {
        display: block;
        text-align: center;
        margin-top: -20px;
        font-size: 12px;
      }
      
      .punteggio {
        display: block;
        text-align: center;
        font-size: 12px;
        margin-top: 10px;
      }
      
      .massimo-punteggio {
        position: absolute;
        bottom: -25px;
        right: 0;
        font-size: 14px;
      }</style>
</head>

<body>
    <header>
        <img src="https://auditft.it/wp-content/uploads/2020/10/auditft-logo.png" alt="Audit Financial Team Srl"
            href="https://auditft.it">
    </header>
    <h1>Profilazione AML</h1>
    <div class="question-container">
        <section></br>
            <h3>In questo questionario ti chiediamo di rispondere ad alcune domande riguardanti il tuo cliente
                e le sue attività in modo da poter creare un profilo di rischio riciclaggio.</h3></br>
            
            <h4>Sulla base di punti ottenuti il rischio associato al cliente sarà il seguente:</h4></br>
            <div class="barra">
                <div class="sezione verde" title="Basso">
                    <span class="descrizione">Basso</span>
                    <span class="punteggio">0-5</span>
                </div>
                <div class="sezione giallo-chiaro" title="Medio-basso">
                    <span class="descrizione">Medio-basso</span>
                    <span class="punteggio">6-10</span>
                </div>
                <div class="sezione giallo" title="Medio">
                    <span class="descrizione">Medio</span>
                    <span class="punteggio">11-15</span>
                </div>
                <div class="sezione arancione" title="Medio-alto">
                    <span class="descrizione">Medio-alto</span>
                    <span class="punteggio">16-19</span>
                </div>
                <div class="sezione rosso" title="Alto">
                    <span class="descrizione">Alto</span>
                    <span class="punteggio">20</span>
                </div>
                <div class="massimo-punteggio">
                    Massimo punteggio ottenibile: 20
                </div>
            </div></br>


        </section>

        <section class="question-box">
            <h2>Appartiene a qualche blacklist europea? <small>(liste come adf,ljkh,mbv)</small></h2>
            <label><input type="radio" name="domanda1" value="opzione1"> No (0 pt.)</label>
            <label><input type="radio" name="domanda1" value="opzione2"> Non so (5 pt.)</label>
            <label><input type="radio" name="domanda1" value="opzione3"> Sì (10 pt.)</label>
        </section>

        <section class="question-box">
            <h2>La sua attività opera in una provincia a rischio?</h2>
            <label><input type="radio" name="domanda2" value="opzione1"> Si (5 pt.)</label>
            <label><input type="radio" name="domanda2" value="opzione2"> No (0 pt.)</label>
        </section>

        <section class="question-box">
            <h2>Quali tra i seguenti?</h2>
            <label><input type="checkbox" name="domanda3-opzione1" value="opzione1"> Opzione 1 (2 pt.)</label>
            <label><input type="checkbox" name="domanda3-opzione2" value="opzione2"> Opzione 2 (2 pt.)</label>
            <label><input type="checkbox" name="domanda3-opzione3" value="opzione3"> Opzione 3 (1 pt.)</label>
        </section>
    </div>
</body>

</html>
    `;

    // const doc = new pdf();

    // doc.from_string(template);
    // doc.end();

    // console.log('micio');

    // var s3ParamsInsert = {
    //     Bucket: process.env.BUCKET_NAME,
    //     Key: 'test-pdf_creator/' + 'pidieffe.pdf',
    //     Body: doc,
    //     contentType : 'application/pdf'
    // };

    // // upload to S3
    // await s3.upload(s3ParamsInsert).promise();



    // Ottieni il template HTML da S3
    // const html = await getTemplateFromS3("nome-file-template.html");

    // Crea un nuovo browser Puppeteer
    const browser = await puppeteer.launch({
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
        defaultViewport: chromium.defaultViewport,
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      });

    // Crea una nuova pagina e naviga fino al contenuto HTML
    const page = await browser.newPage();
    await page.setContent(template, { waitUntil: 'domcontentloaded' });

    // To reflect CSS used for screens instead of print
    await page.emulateMediaType('screen');

    // Genera il PDF e ottieni il buffer del contenuto
    const pdfBuffer = await page.pdf({
        path: 'result.pdf',
        margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
        printBackground: true,
        format: 'A4',
    });

    // Salva il PDF su S3
    await savePdfToS3(pdfBuffer, "puppeteer.pdf");

    // Chiudi il browser Puppeteer
    await browser.close();

    console.log("PDF creato e salvato su S3 con successo!");


    async function getTemplateFromS3(key: string): Promise<string> {
        const params = {
            Bucket: "nome-bucket-s3",
            Key: key,
        };
        const data = await s3.getObject(params).promise();
        return data.Body.toString();
    };

    async function savePdfToS3(pdfBuffer: Buffer, key: string): Promise<void> {
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: key,
            Body: pdfBuffer,
            ContentType: "application/pdf",
        };
        await s3.putObject(params).promise();
    };

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};