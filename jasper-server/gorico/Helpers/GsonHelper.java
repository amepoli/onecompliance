package gorico;

import com.google.gson.Gson;

import javafx.util.Pair;
import java.util.ArrayList;
import java.util.Map;
import java.lang.Class;

import gorico.JasperData;

public class GsonHelper {

    /**
     * Constructor for GsonHelper
     */
    public GsonHelper() {
    }

    // private static GsonHelper instance;

    // /**
    //  * Constructor for GsonHelper
    //  */
    // public static GsonHelper getInstance() {
    //     if (instance == null) {
    //         instance = new GsonHelper();
    //     }
    //     return instance;
    // }

    /**
     * Takes 2 parameters: jsonInput and Java class
     * 
     * @param jsonInput holds Json as String,
     * @return Returns the result as string after deserializing Json into Java
     *         class.
     */
    public static JasperData deserialize(String jsonInput) {
        JasperData output = new Gson().fromJson(jsonInput, JasperData.class);
        // System.out.print(output.toString());
        return output;
    }
}
