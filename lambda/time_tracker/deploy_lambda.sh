#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_dev, xxx_prod, xxx_dev]"
    exit 0
fi

if [ ! -f ../../${1}.json ]; then
    echo "Target not found!"
    exit 0
fi

if [ -f ./index.js.ori ]; then
    echo "Something wrong with your environment, found index.js.ori !"
    exit 0
fi

LAMBDANAME=`cat ../../${1}.json | jq -r ".lambdas.time_tracker.lambdaName"`

DYN_USERSNAME=`cat ../../${1}.json | jq -r ".dynamoTables.users.tableName"`
DYN_PROFILESNAME=`cat ../../${1}.json | jq -r ".dynamoTables.profiles.tableName"`
DYN_VIEWSNAME=`cat ../../${1}.json | jq -r ".dynamoTables.views.tableName"`

DBNAME=`cat ../../${1}.json | jq -r ".postgres.dbName"`
HOSTNAME=`cat ../../${1}.json | jq -r ".postgres.host"`
USERNAME=`cat ../../${1}.json | jq -r ".postgres.username"`
PASSWORD=`cat ../../${1}.json | jq -r ".postgres.password"`
SCHEMA=`cat ../../${1}.json | jq -r ".postgres.schema"`

BUCKETNAME=`cat ../../${1}.json | jq -r ".lambdas.import.s3.bucket"`
REGION="eu-central-1"

CSVDELIMITER="~"

#replace Variables
cp index.js index.js.ori

sed -i -e "s/DB_NAME/${DBNAME}/g" index.js
sed -i -e "s/HOST_NAME/${HOSTNAME}/g" index.js
sed -i -e "s/USER_NAME/${USERNAME}/g" index.js
sed -i -e "s/PASSWORD/${PASSWORD}/g" index.js
sed -i -e "s/USERS_NAME/${DYN_USERSNAME}/g" index.js
sed -i -e "s/PROFILES_NAME/${DYN_PROFILESNAME}/g" index.js
sed -i -e "s/VIEWS_NAME/${DYN_VIEWSNAME}/g" index.js

sed -i -e "s/BUCKET_NAME/${BUCKETNAME}/g" index.js
sed -i -e "s/REGION/${REGION}/g" index.js
sed -i -e "s/SCHEMA/${SCHEMA}/g" index.js

sed -i -e "s/CSV_DELIMITER/${CSVDELIMITER}/g" index.js


rm index.js-e

#copy modules
cp ../modules/helperFuncts.js .
sed -i -e "s/USERS_NAME/${DYN_USERSNAME}/g" helperFuncts.js

#push zip to AWS

rm ./nodejs.zip

npm install

zip -r nodejs.zip node_modules index.js package.json helperFuncts.js

#restore the original file

mv index.js.ori index.js

aws lambda update-function-code --function-name $LAMBDANAME --zip-file fileb://./nodejs.zip

rm helperFuncts.js helperFuncts.js-e