#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_test, gorico_dev, xxx_prod, xxx_test, xxx_dev]"
    exit 0
fi

LAMBDANAME="reports"

DYN_USERSNAME="users"
DYN_PROFILESNAME="profiles"
DYN_VIEWSNAME="views"
DYN_REPORTSNAME="reports"

DBNAME=""
HOSTNAME="goricotest-new.caxbbckt9xen.eu-central-1.rds.amazonaws.com"

if [ $1 == "gorico_dev" ]
  then
    DBNAME="Gorico"
  else
    LAMBDANAME="${LAMBDANAME}_$1"
    DYN_USERSNAME="${DYN_USERSNAME}_$1"
    DYN_PROFILESNAME="${DYN_PROFILESNAME}_$1"
    DYN_VIEWSNAME="${DYN_VIEWSNAME}_$1"
    DYN_REPORTSNAME="${DYN_REPORTSNAME}_$1"
fi

#replace Variables
cp index.js index.js.ori

sed -i -e "s/DB_NAME/${DBNAME}/g" index.js
sed -i -e "s/HOST_NAME/${HOSTNAME}/g" index.js
sed -i -e "s/USERS_NAME/${DYN_USERSNAME}/g" index.js
sed -i -e "s/PROFILES_NAME/${DYN_PROFILESNAME}/g" index.js
sed -i -e "s/VIEWS_NAME/${DYN_VIEWSNAME}/g" index.js
sed -i -e "s/REPORTS_NAME/${DYN_REPORTSNAME}/g" index.js

rm index.js-e

#push zip to AWS

rm ./nodejs.zip

zip -r nodejs.zip node_modules index.js package.json

aws lambda update-function-code --function-name $LAMBDANAME --zip-file fileb://./nodejs.zip

#restore the original file

mv index.js.ori index.js
cd ..