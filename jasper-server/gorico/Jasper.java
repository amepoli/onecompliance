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
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.data.JRCsvDataSource;

import net.sf.jasperreports.engine.JRResultSetDataSource;

import net.sf.jasperreports.engine.util.AbstractSampleApp;
import net.sf.jasperreports.engine.util.JRLoader;
import net.sf.jasperreports.engine.util.JRSaver;

import net.sf.jasperreports.engine.query.JsonQueryExecuterFactory;

import net.sf.jasperreports.engine.design.JRDesignQuery;
import net.sf.jasperreports.engine.JRResultSetDataSource;

import net.sf.jasperreports.data.*;

import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.util.*;

import java.nio.charset.StandardCharsets;
import java.awt.Color;
import java.io.File;
import java.io.IOException;

import java.nio.file.Paths;

import gorico.*;

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

    public void fill() throws JRException {
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

        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, null, (JRDataSource) null);

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
     */
    public void runReport(String databaseName, String userName, String password, String reportFile) {
        try {
            JasperDesign jasperDesign = JRXmlLoader.load(reportFile);
            JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);
            Connection jdbcConnection = Database.getInstance().connectSqlDB(databaseName, userName, password);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, null, jdbcConnection);
            JasperViewer.viewReport(jasperPrint);
            jdbcConnection.close();
        } catch (Exception ex) {
            String connectMsg = "Could not create the report " + ex.getMessage() + " " + ex.getLocalizedMessage();
            System.out.println(connectMsg);
        }
    }

    public String createReportUsingJasperData(JasperData data) {
        try {

            // String connectString =
            // "jdbc:postgresql://goricotest-new.caxbbckt9xen.eu-central-1.rds.amazonaws.com:5432/Gorico";
            String connectString = "jdbc:postgresql://" + Constants.POSTGRES_SERVER + ":" + Constants.POSTGRES_PORT
                    + "/" + Constants.POSTGRES_DATABASE;
            Connection jdbcConnection = Database.getInstance().connectPgDB(connectString, Constants.POSTGRES_USERNAME,
                    Constants.POSTGRES_PASSWORD);

            JasperDesign mainReportDesign = JRXmlLoader.load(Constants.REPORTS_DIR + data.mainReport.name + ".jrxml");
            JasperReport mainReport = JasperCompileManager.compileReport(mainReportDesign);

            // ResultSet mainReportResultSet = jdbcConnection
            // .createStatement(ResultSet.TYPE_SCROLL_SENSITIVE,
            // ResultSet.CONCUR_READ_ONLY).executeQuery(data.mainReport.query);

            // JRResultSetDataSource mainReportDataSource = new
            // JRResultSetDataSource(mainReportResultSet);

            HashMap<String, Object> params = new HashMap<String, Object>();
            // params.put("username", "Report title 101");
            // params.put("LOGO", "Report title 101");

            params.put("mainQuery", data.mainReport.query);

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

            for (JasperParam param : data.params) {
                params.put(param.key, param.value);
                System.out.println("Key: " + param.key + ", value: " + param.value);

                if (param.key.toLowerCase().equals("codice_azienda")) {
                    companyName = param.value;
                }
                if (param.key.toLowerCase().equals("logo")) {
                    logoProvided = true;
                }
            }

            if (companyName != null && !logoProvided) {
                params.put("LOGO", companyName + ".png");
            }

            String logos_path = Paths.get(Constants.LOGOS_DIR).toAbsolutePath().normalize().toString() + "/";
            // String logos_path = Constants.LOGOS_DIR;
            params.put("PATH_IMG", logos_path);
            params.put("REPORTS_MAP", reportMap);

            System.out.println("Logos Path: " + logos_path);

            // params.put("modelloTestVr.domandeSezioni", "modelloTestVr.domandeSezioni");
            // params.put("tipoModelloTest.descrizione", "tipoModelloTest.descrizione");

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
