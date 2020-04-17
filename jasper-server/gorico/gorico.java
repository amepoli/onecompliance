package gorico;

import gorico.Server;
import gorico.Jasper;

public class gorico {

    /**
     * Constructor for gorico
     */
    public gorico() {
    }

    /**
     * Uses runReport method to connect to the database and to prepare and view the
     * report.
     * 
     * @param args Takes 4 arguments as an input: databaseName, userName, password,
     *             reportFileLocation args[0] holds database name, args[1] holds
     *             user name args[2] holds password to connect the database, args[3]
     *             holds the location of the Jasper Report file (.jrxml)
     */
    public static void main(String[] args) {
        if (args.length == 4) {
            String databaseName = args[0];
            String userName = args[1];
            String password = args[2];
            String reportFile = args[3];
            Jasper jasper = new Jasper();
            jasper.runReport(databaseName, userName, password, reportFile);
        } else {
            // startServer();
            Server server = new Server();
            //server.downloadLogos();
            System.out.println("Starting server...");
            server.startServer();
            System.out.println("Server up and running!");
            

            // System.out.println("Usage:");
            // System.out.println("java Gorico databaseName userName password
            // reportFileLocation");
        }
        return;
    }
}
