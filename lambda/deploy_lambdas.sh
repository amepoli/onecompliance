#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_dev, xxx_prod, xxx_dev]"
    exit 0
fi

cd tables
echo "Deploying tables"
./deploy_lambda.sh $1
cd ../attachments
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
cd ../import
echo "Deploying import"
./deploy_lambda.sh $1
cd ../email_trigger
echo "Deploying email trigger"
./deploy_lambda.sh $1
cd ../email_sender
echo "Deploying email sender"
./deploy_lambda.sh $1
cd ../email_composer
echo "Deploying email composer"
./deploy_lambda.sh $1
cd ../email_result_handler
echo "Deploying email result handler"
./deploy_lambda.sh $1
cd ..
#TODO: ADD THE TIME TRACKER LAMBDA !!!!!!!
