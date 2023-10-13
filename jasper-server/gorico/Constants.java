package gorico;

import java.util.Calendar;
import java.util.HashMap;
import java.text.SimpleDateFormat;

public class Constants {

    public static final String POSTGRES_PORT = "5432";

    public static final String REPORTS_DIR = "./reports/";
    public static final String LOGOS_DIR = "./logos/";

    public static final String[] LOGOS = { "2pay.png", "INattivo.png", "Investire.png", "LaColombo_Logo.png",
            "NEIPIII.png", "ifir.png", "resco.jpg", "rosacanina.png", "selpower.jpg", "silkwayshipping.png" };

    public static final String DATE_FORMAT = "yyyy-MM-dd_HH-mm-ss";

    public static final String LOCALIZATIONS_BUCKET_NAME = "gorico2-reports";
    public static final String LOCALIZATIONS_BUCKET_PATH = "Jasper-localization/";
    public static final String LOCALIZATIONS_BUCKET_KEY_EN =  "en.properties";
    public static final String LOCALIZATIONS_BUCKET_KEY_IT =  "it.properties";
    public static final String LOCALIZATIONS_DIR = "./files/";
    public static final String LOCALIZATIONS_DEFAULT = "it";

    public static HashMap<String, String> LOCALIZATIONS_KEYS = new HashMap<String, String>() {{
        put("en", LOCALIZATIONS_BUCKET_KEY_EN);
        put("it", LOCALIZATIONS_BUCKET_KEY_IT);
    }};
    
    /**
     * Constructor for Constants
     */
    public Constants() {
    }

    public static String GET_CURRENT_DATE_TIME() {
        Calendar cal = Calendar.getInstance();
        SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);
        return sdf.format(cal.getTime());
    }

}
