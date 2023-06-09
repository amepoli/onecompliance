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

if [ -f ./index.ts.ori ]; then
    echo "Something wrong with your environment, found index.js.ori !"
    exit 0
fi

LAMBDANAME=`cat ../../${1}.json | jq -r ".lambdas.users_check_duplicate.lambdaName"`
BUCKETNAME=`cat ../../${1}.json | jq -r ".lambdas.users_check_duplicate.s3.bucket"`
DYN_USERSNAME=`cat ../../${1}.json | jq -r ".dynamoTables.users.tableName"`

tsc index.ts

#replace Variables
cp index.js index.js.ori

sed -i -e "s/USERS_NAME/${DYN_USERSNAME}/g" index.js

rm index.js-e

#push zip to AWS

rm ./nodejs.zip

zip -r nodejs.zip node_modules index.js package.json

#restore the original file

mv index.js.ori index.js

aws lambda update-function-code --function-name $LAMBDANAME --zip-file fileb://./nodejs.zip


