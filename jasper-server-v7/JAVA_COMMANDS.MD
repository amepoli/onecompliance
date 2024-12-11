# Commands:

## To build Java classes
javac -d ./build *.java

## To create a jar file using Manifest.txt
jar cfm MyJar.jar Manifest.txt gorico/*.class
OR
jar -cvfm MyJar.jar Manifest.txt gorico/*.class


## To run a jar file
java -jar MyJar.jar
