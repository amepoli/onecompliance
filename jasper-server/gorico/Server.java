package gorico;

import java.io.File;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.io.BufferedInputStream;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;

import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.util.UUID;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import gorico.aws.S3;
import gorico.helpers.GsonHelper;
import gorico.models.JasperData;

public class Server {

    private Jasper jasper = null;

    private static final String F_NAME = "fname";
    private static final String L_NAME = "lname";

    private static final String REPORT_NAME = "reportName";

    private static final int PARAM_NAME_IDX = 0;
    private static final int PARAM_VALUE_IDX = 1;

    private static final int HTTP_OK_STATUS = 200;

    private static final String AND_DELIMITER = "&";
    private static final String EQUAL_DELIMITER = "=";

    /**
     * Constructor for server
     */
    public Server() {
        jasper = new Jasper();
    }

    // public void handle(Pair<String, String> id, HttpExchange he, String[] path)
    // throws Exception {
    // Handler handler = handlers.get(id);
    // if (handler == null) {
    // // logger.log(Level.SEVERE, "Missing handler: {0}", id);
    // handler = handlers.get(null);
    // }
    // if (!handler.validate(he.getRequestHeaders(), path)) {
    // he.getResponseHeaders().set("WWW-Authenticate", "Basic realm=\"TurtleAPI\"");
    // handler.sendResponse(he, 401, "{\"err\":\"Unauthorized\"}");
    // // logger.log(Level.SEVERE, "Unauthorized");
    // return;
    // }
    // try (OutputStream out = he.getResponseBody()) {
    // try (InputStream in = he.getRequestBody()) {
    // handler.handle(he, in, out, path);
    // }
    // }
    // }

    public class IndexHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String response = "Java Server up and running.";
            t.sendResponseHeaders(200, response.length());
            OutputStream os = t.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }

    public class JsonIndexHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            // retrieve the request json data
            InputStream is = t.getRequestBody();
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[2048];
            int len;
            while ((len = is.read(buffer)) > 0) {
                bos.write(buffer, 0, len);
            }
            bos.close();

            // Create a response form the request query parameters
            URI uri = t.getRequestURI();
            String reportName = getReportsNameFromQueryParams(uri);

            String data = new String(bos.toByteArray(), Charset.forName("UTF-8"));
            // System.out.print("Request: \n " + data);
            // pass the data to the handler and receive a response
            JasperData jasperData = GsonHelper.deserialize(data);

            // System.out.print(jasperData.toString());

            // String reportResult = jasper.createReport(reportName, data);
            System.out.println("Creating Jasper report...");
            String reportResult = jasper.createReportUsingJasperData(jasperData);

            if (reportResult == null) {
                String response = "reportName: " + reportName + ", " + jasperData.toString() + ", data: " + data; // handler.handleRequest(data);
                // System.out.print(" " + response);

                // format and return the response to the user
                t.sendResponseHeaders(200, response.getBytes(Charset.forName("UTF-8")).length);
                // t.getResponseHeaders().set("Content-Type", "application/json");
                t.getResponseHeaders().set("Content-Type", "application/json, charset=UTF-8");
                OutputStream os = t.getResponseBody();
                os.write(response.getBytes(Charset.forName("UTF-8")));
                os.close();

            } else {

                System.out.println("Uploading report to S3 bucket...");
                UUID uuid = UUID.randomUUID();
                String pdfKey = reportResult + "-" + uuid.toString() + ".pdf";

                // String pdfKey = reportResult + "_" + Constants.GET_CURRENT_DATE_TIME() + ".pdf";

                String objectUrl = S3.getInstance().PutPreSignedObject("PDFs/" + pdfKey,
                        new File(Constants.REPORTS_DIR + reportResult + ".pdf"));
                System.out.println("Request complete!");

                // Send url
                t.sendResponseHeaders(200, objectUrl.length());
                OutputStream os = t.getResponseBody();
                os.write(objectUrl.getBytes());
                os.close();

                // Send PDF file
                // Headers header = t.getResponseHeaders();
                // header.add("Content-Type", "application/pdf");
                // header.add("Content-Disposition", "attachment; filename=\"file.pdf\"");

                // File indexFile = new File(reportResult);
                // byte[] indexFileByteArray = new byte[(int) indexFile.length()];

                // BufferedInputStream requestStream = new BufferedInputStream(new
                // FileInputStream(indexFile));
                // requestStream.read(indexFileByteArray, 0, indexFileByteArray.length);
                // requestStream.close();

                // t.sendResponseHeaders(200, indexFile.length());
                // OutputStream responseStream = t.getResponseBody();
                // responseStream.write(indexFileByteArray, 0, indexFileByteArray.length);
                // responseStream.close();
            }

        }
    }

    public class PrintHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            try {
                jasper.fill();
                jasper.pdf();
            } catch (Exception e) {
                System.out.println(e.getMessage());
            }

            Headers header = t.getResponseHeaders();
            header.add("Content-Type", "application/pdf");
            header.add("Content-Disposition", "attachment; filename=\"file.pdf\"");

            File indexFile = new File("./samples/AlterDesignReport.pdf");
            byte[] indexFileByteArray = new byte[(int) indexFile.length()];

            BufferedInputStream requestStream = new BufferedInputStream(new FileInputStream(indexFile));
            requestStream.read(indexFileByteArray, 0, indexFileByteArray.length);
            requestStream.close();

            t.sendResponseHeaders(200, indexFile.length());
            OutputStream responseStream = t.getResponseBody();
            responseStream.write(indexFileByteArray, 0, indexFileByteArray.length);
            responseStream.close();

        }
    }

    public class QueryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {

            // Create a response form the request query parameters
            URI uri = t.getRequestURI();
            String response = createResponseFromQueryParams(uri);

            System.out.println("Response: " + response);
            // Set the response header status and length
            t.sendResponseHeaders(HTTP_OK_STATUS, response.getBytes().length);
            // Write the response string
            OutputStream os = t.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }

    /**
     * Creates the response from query params.
     *
     * @param uri the uri
     * @return the string
     */
    private String createResponseFromQueryParams(URI uri) {

        String fName = "";
        String lName = "";
        // Get the request query
        String query = uri.getQuery();
        if (query != null) {
            System.out.println("Query: " + query);
            String[] queryParams = query.split(AND_DELIMITER);
            if (queryParams.length > 0) {
                for (String qParam : queryParams) {
                    String[] param = qParam.split(EQUAL_DELIMITER);
                    if (param.length > 0) {
                        for (int i = 0; i < param.length; i++) {
                            if (F_NAME.equalsIgnoreCase(param[PARAM_NAME_IDX])) {
                                fName = param[PARAM_VALUE_IDX];
                            }
                            if (L_NAME.equalsIgnoreCase(param[PARAM_NAME_IDX])) {
                                lName = param[PARAM_VALUE_IDX];
                            }
                        }
                    }
                }
            }
        }

        return "Hello, " + fName + " " + lName;
    }

    /**
     * Gets the report name from the response from query params.
     *
     * @param uri the uri
     * @return the string
     */
    private String getReportsNameFromQueryParams(URI uri) {

        String reportName = "";
        // Get the request query
        String query = uri.getQuery();
        if (query != null) {
            System.out.println("Query: " + query);
            String[] queryParams = query.split(AND_DELIMITER);
            if (queryParams.length > 0) {
                for (String qParam : queryParams) {
                    String[] param = qParam.split(EQUAL_DELIMITER);
                    if (param.length > 0) {
                        for (int i = 0; i < param.length; i++) {
                            if (REPORT_NAME.equalsIgnoreCase(param[PARAM_NAME_IDX])) {
                                reportName = param[PARAM_VALUE_IDX];
                            }
                        }
                    }
                }
            }
        }

        return reportName;
    }

    /**
     * Download all Company logos
     */
    public void downloadLogos() {
        try {
            (new File("images")).mkdir();

            for (String logo : Constants.LOGOS) {
                File file = new File(Constants.LOGOS_DIR + logo);
                S3.getInstance().DownloadObject(logo, file, false);
            }

            System.out.println("Logos downloaded successfully!");

        } catch (Exception e) {
            System.out.print(e.getMessage());
        }
    }

    /**
     * Starts the server
     */
    public void startServer() {
        try {            
            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
            server.createContext("/", new IndexHandler());
            server.createContext("/json", new JsonIndexHandler());

            server.createContext("/print", new PrintHandler());
            server.createContext("/query", new QueryHandler());

            server.setExecutor(null); // creates a default executor
            server.start();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

}
