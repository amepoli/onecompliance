package gorico.Models;

public class DatabaseDetails {
    public String host;
    public String port;
    public String database;
    public String username;
    public String password;

    public String getHost() {
        return host;
    }

    public void setHost(String Host) {
        this.host = Host;
    }

    public String getPort() {
        return port;
    }

    public void setPort(String Port) {
        this.port = Port;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String Database) {
        this.database = Database;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String Username) {
        this.username = Username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String Password) {
        this.password = Password;
    }

    public DatabaseDetails() {
    }

    public DatabaseDetails(String Host, String Port, String Database, String Username, String Password) {
        this.host = Host;
        this.port = Port;
        this.database = Database;
        this.username = Username;
        this.password = Password;
    }
}