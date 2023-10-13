# First clean up
sh ./clean.sh

#cp Manifest.txt ./build/Manifest.txt

cp -r ./libs/. ./build/libs/.
cp -r ./logos/. ./build/logos/.
cp -r ./reports/. ./build/reports/.

# Build
echo "Compiling java classes..."

javac -Xlint:unchecked -Xlint:deprecation -classpath ".:libs/*" -d ./build ./gorico/*.java ./gorico/*/*.java
# javac -classpath ".:gorico/libs/jasper/jasperreports-6.9.0.jar" -d ./build ./gorico/*.java

#ls gorico/libs/jasper/*.jar >> FilesList.txt
#javac @FilesList.txt -d ./build ./gorico/*.java

echo "Making jar..."
cd ./build
jar cfm gorico.jar ../Manifest.txt gorico/*.class gorico/*/*.class
echo "Build successful!"
