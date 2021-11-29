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

if [ ! -d "dynamo-input" ]; then
    mkdir dynamo-input
fi

rm -f dynamo-input/*

TABLENAME=`cat ../../${1}.json | jq -r ".dynamoTables.users.tableName"`

if [ $? -ne 0 ]
  then
    echo "Something went wrong!"
    exit 1
fi 

MAINKEY=`cat ../../${1}.json | jq -r ".dynamoTables.users.mainKey"`

if [ $? -ne 0 ]
  then
    echo "Something went wrong!"
    exit 1
fi 

aws dynamodb scan --table-name ${TABLENAME} > ./dynamo-input/users.json

cat ./dynamo-input/users.json | for d in `jq -r ".Items[].username.S"`; do cat ./dynamo-input/users.json | jq -r ".Items[] | select(.username.S == \"$d\")" | jq -f ./dynamodb_decode.jq | perl -0777 -pe "s/{\n {1,}\"NULL\": true\n {1,}}/null/g" > $d.json ; done

rm dynamo-input/users.json