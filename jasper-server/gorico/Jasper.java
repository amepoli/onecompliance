package gorico;

import java.sql.*;

import net.sf.jasperreports.view.JasperViewer;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.JasperReport;

import net.sf.jasperreports.engine.JRDataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRRectangle;
import net.sf.jasperreports.engine.JRStyle;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperPrintManager;
import net.sf.jasperreports.engine.data.JRCsvDataSource;

import net.sf.jasperreports.engine.util.JRLoader;
import net.sf.jasperreports.engine.util.JRSaver;
import net.sf.jasperreports.engine.JRParameter;

import java.util.*;

import java.awt.Color;
import java.io.File;
import java.io.IOException;

import java.nio.file.Paths;

import gorico.helpers.Database;
import gorico.helpers.Localizations;
import gorico.models.DatabaseDetails;
import gorico.models.JasperData;
import gorico.models.JasperParam;
import gorico.models.ReportInfo;

public class Jasper {

    /**
     * Constructor for gorico
     */
    public Jasper() {
    }

    public JRCsvDataSource getCsvDataSource(String file) throws JRException, IOException {
        JRCsvDataSource ds = new JRCsvDataSource(JRLoader.getLocationInputStream(file));
        // JRCsvDataSource ds = new JRCsvDataSource(new File(file));
        ds.setRecordDelimiter("\r");
        ds.setUseFirstRowAsHeader(true);
        ds.setFieldDelimiter(';');

        // String[] columnNames = new String[] { "id", "data", "descricao",
        // "tipoMovimentacao", "valor" };
        // ds.setColumnNames(columnNames);
        // ds.setDatePattern("yyyy-MM-dd");

        return ds;
    }

    public void fill(String locale) throws Exception {
        long start = System.currentTimeMillis();

        // File sourceFile = new File("build/reports/AlterDesignReport.jasper");
        // System.err.println(" : " + sourceFile.getAbsolutePath());
        // JasperReport jasperReport = (JasperReport) JRLoader.loadObject(sourceFile);

        JasperDesign jasperDesign = JRXmlLoader.load("./samples/AlterDesignReport.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);

        JRRectangle rectangle = (JRRectangle) jasperReport.getTitle().getElementByKey("first.rectangle");
        rectangle.setForecolor(new Color((int) (16000000 * Math.random())));
        rectangle.setBackcolor(new Color((int) (16000000 * Math.random())));

        rectangle = (JRRectangle) jasperReport.getTitle().getElementByKey("second.rectangle");
        rectangle.setForecolor(new Color((int) (16000000 * Math.random())));
        rectangle.setBackcolor(new Color((int) (16000000 * Math.random())));

        rectangle = (JRRectangle) jasperReport.getTitle().getElementByKey("third.rectangle");
        rectangle.setForecolor(new Color((int) (16000000 * Math.random())));
        rectangle.setBackcolor(new Color((int) (16000000 * Math.random())));

        JRStyle style = jasperReport.getStyles()[0];
        style.setFontSize(16f);
        style.setItalic(Boolean.TRUE);

        // Load the locale
        HashMap<String, Object> parameterMap = new HashMap<String, Object>();
        parameterMap.put(JRParameter.REPORT_LOCALE, new Locale(locale));
        parameterMap.put(JRParameter.REPORT_RESOURCE_BUNDLE, Localizations.GetResourceBundle(Constants.LOCALIZATIONS_BUCKET_KEY_EN));
        
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameterMap, (JRDataSource) null);

        File destFile = new File("./samples/", jasperReport.getName() + ".jrprint");
        JRSaver.saveObject(jasperPrint, destFile);

        System.err.println("Filling time : " + (System.currentTimeMillis() - start));
    }

    /**
     *
     */
    public void print() throws JRException {
        long start = System.currentTimeMillis();
        JasperPrintManager.printReport("./samples/AlterDesignReport.jrprint", true);
        System.err.println("Printing time : " + (System.currentTimeMillis() - start));
    }

    /**
     *
     */
    public void pdf() throws JRException {
        long start = System.currentTimeMillis();
        JasperExportManager.exportReportToPdfFile("./samples/AlterDesignReport.jrprint");
        System.err.println("PDF creation time : " + (System.currentTimeMillis() - start));
    }

    /**
     * Takes 4 parameters: databaseName, userName, password, reportFileLocation and
     * connects to the database and prepares and views the report.
     * 
     * @param databaseName holds database name,
     * @param userName     holds user name
     * @param password     holds password to connect the database,
     * @param reportFile   holds the location of the Jasper Report file (.jrxml)
     * @param locale       holds the locale to use for internationalization
     */
    public void runReport(String databaseName, String userName, String password, String reportFile, String locale) {
        try {
            JasperDesign jasperDesign = JRXmlLoader.load(reportFile);
            JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);
            Connection jdbcConnection = Database.getInstance().connectSqlDB(databaseName, userName, password);

            // Load the locale
            HashMap<String, Object> parameterMap = new HashMap<String, Object>();
            parameterMap.put(JRParameter.REPORT_LOCALE, new Locale(locale));
            parameterMap.put(JRParameter.REPORT_RESOURCE_BUNDLE, Localizations.GetResourceBundle(Constants.LOCALIZATIONS_BUCKET_KEY_EN));
            
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameterMap, jdbcConnection);
            JasperViewer.viewReport(jasperPrint);
            jdbcConnection.close();
        } catch (Exception ex) {
            String connectMsg = "Could not create the report " + ex.getMessage() + " " + ex.getLocalizedMessage();
            System.out.println(connectMsg);
        }
    }

    public String createReportUsingJasperData(JasperData data) {
        try {
            
            // ResultSet mainReportResultSet = jdbcConnection
            // .createStatement(ResultSet.TYPE_SCROLL_SENSITIVE,
            // ResultSet.CONCUR_READ_ONLY).executeQuery(data.mainReport.query);

            // JRResultSetDataSource mainReportDataSource = new
            // JRResultSetDataSource(mainReportResultSet);

            HashMap<String, Object> params = new HashMap<String, Object>();
            // params.put("username", "Report title 101");
            // params.put("LOGO", "Report title 101");

            params.put("mainQuery", data.mainReport.query);

            // Load locale
            String locale = (data.locale != null && !data.locale.trim().isEmpty()) ? data.locale: Constants.LOCALIZATIONS_DEFAULT;

            HashMap<String, Object> reportMap = new HashMap<String, Object>();

            for (ReportInfo subReport : data.subReports) {
                JasperDesign reportDesign = JRXmlLoader.load(Constants.REPORTS_DIR + subReport.name + ".jrxml");
                JasperReport report = JasperCompileManager.compileReport(reportDesign);
                // ResultSet reportResultSet = jdbcConnection
                // .createStatement(ResultSet.TYPE_SCROLL_SENSITIVE,
                // ResultSet.CONCUR_READ_ONLY).executeQuery(subReport.query);

                // JRResultSetDataSource reportDataSource = new
                // JRResultSetDataSource(reportResultSet);

                reportMap.put(subReport.name, report);
                // params.put(subReport.name + "DataSource", reportDataSource);

            }

            String companyName = null;
            boolean logoProvided = false;
            
            DatabaseDetails db = new DatabaseDetails();
            db.setPort(Constants.POSTGRES_PORT);

            for (JasperParam param : data.params) {
                params.put(param.key, param.value);
                System.out.println("Key: " + param.key + ", value: " + param.value);

                if (param.key.toLowerCase().equals("codice_azienda")) {
                    companyName = (String) param.value;
                }
                if (param.key.toLowerCase().equals("logo")) {
                    logoProvided = true;
                }

                if (param.key.toLowerCase().equals("db_host")) {
                    db.setHost((String) param.value);
                }
                if (param.key.toLowerCase().equals("db_name")) {
                    db.setDatabase((String) param.value);
                }
                if (param.key.toLowerCase().equals("db_user")) {
                    db.setUsername((String) param.value);
                }
                if (param.key.toLowerCase().equals("db_password")) {
                    db.setPassword((String) param.value);
                }
            }

            if (companyName != null && !logoProvided) {
                params.put("LOGO", companyName + ".png");
            }

            String logos_path = Paths.get(Constants.LOGOS_DIR).toAbsolutePath().normalize().toString() + "/";
            // String logos_path = Constants.LOGOS_DIR;
            params.put("PATH_IMG", logos_path);
            params.put("REPORTS_MAP", reportMap);

            // Load the locale
            params.put(JRParameter.REPORT_LOCALE, new Locale(locale));
            params.put(JRParameter.REPORT_RESOURCE_BUNDLE, Localizations.GetResourceBundle(Constants.LOCALIZATIONS_BUCKET_KEY_EN));
            
            System.out.println("Logos Path: " + logos_path);

            // params.put("modelloTestVr.domandeSezioni", "modelloTestVr.domandeSezioni");
            // params.put("tipoModelloTest.descrizione", "tipoModelloTest.descrizione");

            // String connectString =
            // "jdbc:postgresql://goricotest-new.caxbbckt9xen.eu-central-1.rds.amazonaws.com:5432/Gorico";
            String connectString = "jdbc:postgresql://" + db.getHost() + ":" + db.getPort() + "/" + db.getDatabase();
            Connection jdbcConnection = Database.getInstance().connectPgDB(connectString, db.getUsername(), db.getPassword());

            JasperDesign mainReportDesign = JRXmlLoader.load(Constants.REPORTS_DIR + data.mainReport.name + ".jrxml");
            JasperReport mainReport = JasperCompileManager.compileReport(mainReportDesign);

            JasperPrint jasperPrint = JasperFillManager.fillReport(mainReport, params, jdbcConnection);
            jdbcConnection.close();

            /* Bean filling */
            // ArrayList<Employee> employees = new ArrayList<Employee>();
            // employees.add(new Employee("John", "Doe"));
            // employees.add(new Employee("Anna", "Smith"));
            // employees.add(new Employee("Peter", "Jones"));

            // JRBeanCollectionDataSource beanCollectionDataSource = new
            // JRBeanCollectionDataSource(employees);
            // JasperPrint jasperPrint = JasperFillManager.fillReport(mainReport, params,
            // beanCollectionDataSource);

            /* CSV filling */
            // JRCsvDataSource csvSource = getCsvDataSource("./reports/modelliTest.csv");
            // JasperPrint jasperPrint = JasperFillManager.fillReport(mainReport, params,
            // csvSource);

            File destFile = new File(Constants.REPORTS_DIR, mainReport.getName() + ".jrprint");
            JRSaver.saveObject(jasperPrint, destFile);

            JasperExportManager.exportReportToPdfFile(Constants.REPORTS_DIR + mainReport.getName() + ".jrprint");
            return mainReport.getName();

        } catch (Exception ex) {
            String connectMsg = "Could not create the report " + ex.getMessage() + " " + ex.getLocalizedMessage();
            System.out.println(connectMsg);
            return null;
        }
    }
}
