package gorico;

import javafx.util.Pair;
import java.util.ArrayList;
import java.util.Map;

import net.sf.jasperreports.data.*;

public class JasperDataAdapter implements DataAdapter {

  public String name;

  @Override
  public String getName() {
    return this.name;
  }

  @Override
  public void setName(String name) {
    this.name = name;
  }

  /**
   * Constructor for JasperDataAdapter
   */
  public JasperDataAdapter() {
  }

  @Override
  public String toString() {
    return "[Name=" + name + "]";
  }

}
