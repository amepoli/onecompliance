package gorico;

public class ReportInfo {
    public String name;
    public String query;

    public String getName() {
        return name;
    }

    public void setName(String First_name) {
        this.name = First_name;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String Last_name) {
        this.query = Last_name;
    }

    public ReportInfo(){
        this.name = "Name";
        this.query = "Query";
    }
    
    public ReportInfo(String name, String query) {
        this.name = name;
        this.query = query;
    }
}