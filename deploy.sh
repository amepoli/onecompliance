#/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target application [gorico, xxx]"
    exit 0
fi

if [ ! -f ${1}_prod.json ]; then
    echo "Target not found!"
    exit 0
fi

#copy amplify.js into amplify.ts just in case any api has been added
cp src/aws-exports.js src/aws-exports.ts

#remove previous buils
rm -rf dist/*

rm appdata.json
ln -s $1_prod.json appdata.json

#re-deploy lambdas
cd lambda 
./deploy_lambdas.sh $1_prod

#re-deploy dynamo-tables
cd ../dynamo-tables
./deploy_tables.sh $1_prod
cd ..

#compile application
npm run build-prod
#delete current distribution
aws s3 rm s3://gorico2.cloud/$1 --recursive
#upload files
aws s3 cp ./dist s3://gorico2.cloud/$1 --recursive --acl public-read

#revert back to dev environment
rm appdata.json
ln -s $1_dev.json appdata.json