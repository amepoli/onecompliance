#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_test, gorico_dev, xxx_prod, xxx_test, xxx_dev]"
    exit 0
fi

cd tables
echo "Deploying tables"
./deploy_lambda.sh $1
cd ../allegati
echo "Deploying allegati"
./deploy_lambda.sh $1
cd ../navigation
echo "Deploying navigation"
./deploy_lambda.sh $1
cd ../reports
echo "Deploying reports"
./deploy_lambda.sh $1
cd ../translation
echo "Deploying translation"
./deploy_lambda.sh $1
cd ../users
echo "Deploying users"
./deploy_lambda.sh $1
cd ../views
echo "Deploying views"
./deploy_lambda.sh $1
cd ..

