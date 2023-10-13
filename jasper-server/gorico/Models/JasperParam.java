package gorico.models;

public class JasperParam {
    public String key;
    public Object value;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public JasperParam(){
        this.key = "Key";
        this.value = "Value";
    }
    
    public JasperParam(String key, Object value) {
        this.key = key;
        this.value = value;
    }
}