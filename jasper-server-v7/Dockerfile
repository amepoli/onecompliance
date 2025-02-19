FROM openjdk:23-jdk
WORKDIR /var/www/java

#ADD gorico.jar gorico.jar
# copy everything else and build
COPY ./build/gorico.jar /var/www/java
COPY ./build/libs/* /var/www/java/libs/

EXPOSE 8080
CMD java -jar ./gorico.jar