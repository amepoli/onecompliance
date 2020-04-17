package gorico;

import javafx.util.Pair;
import java.util.ArrayList;
import java.util.Map;

import gorico.*;

public class JasperData {

    public ReportInfo mainReport;
    public ReportInfo[] subReports;
    public JasperParam[] params;

    /**
     * Constructor for JasperData
     */
    public JasperData() {
    }

    @Override
    public String toString() {
      return "Jasper Data: [mainReport.query=" + mainReport.query + ", subReport.query=" + subReports[0].query + "]";
    }

}
