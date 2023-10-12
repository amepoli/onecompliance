package gorico.helpers;


import java.sql.*;

public class Database {
    
    private static Database instance = null;

    public Connection jdbcConnection = null;
    

    /**
     * Takes 3 parameters: databaseName, userName, password and connects to the
     * database.
     * 
     * @param databaseName holds database name,
     * @param userName     holds user name
     * @param password     holds password to connect the database,
     * @return Returns the JDBC connection to the database
     */
    public Connection connectSqlDB(String databaseName, String userName, String password) {
        try {
            Class.forName("oracle.jdbc.driver.OracleDriver");
            jdbcConnection = DriverManager.getConnection(databaseName, userName, password);
        } catch (Exception ex) {
            String connectMsg = "Could not connect to the database: " + ex.getMessage() + " "
                    + ex.getLocalizedMessage();
            System.out.println(connectMsg);
        }
        return jdbcConnection;
    }

    /**
     * Takes 3 parameters: databaseName, userName, password and connects to the
     * database.
     * 
     * @param databaseName holds database name,
     * @param userName     holds user name
     * @param password     holds password to connect the database,
     * @return Returns the JDBC connection to the database
     */
    public Connection connectPgDB(String databaseName, String userName, String password) {
        try {
            Class.forName("org.postgresql.Driver");
            jdbcConnection = DriverManager.getConnection(databaseName, userName, password);
        } catch (Exception ex) {
            String connectMsg = "Could not connect to the database: " + ex.getMessage() + " "
                    + ex.getLocalizedMessage();
            System.out.println(connectMsg);
        }
        return jdbcConnection;
    }

    public static Database getInstance(){
        if(instance == null){
            instance = new Database();
        }
        return instance;
    }
    
    public Database(){
    }
    
}