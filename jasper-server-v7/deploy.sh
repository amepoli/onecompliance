# First build
sh ./build.sh

echo "getting gorico.jar..."
rm -f ./caprover/gorico.jar
cp ./build/gorico.jar ./caprover/gorico.jar

cd ./caprover
echo "Adding to git..."
git add .
git status
git commit -am "update"

echo "Deploying to caprover.."
caprover deploy