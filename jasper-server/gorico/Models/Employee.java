package gorico;

public class Employee {
    public String firstName;
    public String lastName;

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String First_name) {
        this.firstName = First_name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String Last_name) {
        this.lastName = Last_name;
    }

    public Employee(){
        this.firstName = "First name";
        this.lastName = "Last name";
    }
    
    public Employee(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
}