FROM java:8
WORKDIR /var/www/java

#ADD gorico.jar gorico.jar
# copy everything else and build
COPY gorico.jar ./var/www/java

EXPOSE 8080
CMD java -jar gorico.jar