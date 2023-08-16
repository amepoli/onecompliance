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

#remove previous buils
rm -rf dist/*

#re-deploy dynamo-tables
cd dynamo-tables
./deploy_tables.sh $1_prod
cd ..

#compile application
npm run build-prod
#delete current distribution
aws s3 rm s3://gorico2-cdk.cloud/$1 --recursive
#upload files
aws s3 cp ./dist s3://gorico2-cdk.cloud/$1 --recursive --acl public-read
