package gorico;

import java.awt.Color;
import java.io.File;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.io.BufferedInputStream;

import java.util.Calendar;
import java.text.SimpleDateFormat;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;
import javafx.util.Pair;
import java.util.ArrayList;

import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.net.URI;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import gorico.Jasper;
import gorico.JasperData;
import gorico.GsonHelper;

public class Constants {

    public static final String POSTGRES_PORT = "5432";

    public static final String REPORTS_DIR = "./reports/";
    public static final String LOGOS_DIR = "./logos/";

    public static final String[] LOGOS = { "2pay.png", "INattivo.png", "Investire.png", "LaColombo_Logo.png",
            "NEIPIII.png", "ifir.png", "resco.jpg", "rosacanina.png", "selpower.jpg", "silkwayshipping.png" };

    public static final String DATE_FORMAT = "yyyy-MM-dd_HH-mm-ss";

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
