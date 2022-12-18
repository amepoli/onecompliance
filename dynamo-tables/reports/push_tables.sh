#!/bin/bash
#run 'npm install --global json-dynamo-putrequest' before launching the script the first time 

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

if [ $# -eq 2 ]
  then
    FILES=${2}.json
    if [ ! -f ${FILES} ]; then
        echo "File not found!"
        exit 0
    fi
    files=("${FILES}") # used later for pushing a specific file
  else
    files=(*.json)  # used later for pushing all files
fi   

TABLENAME=`cat ../../${1}.json | jq -r ".dynamoTables.reports.tableName"`

if [ $? -ne 0 ]
  then
    echo "Something went wrong!"
    exit 1
fi 

MAINKEY=`cat ../../${1}.json | jq -r ".dynamoTables.reports.mainKey"`

if [ $? -ne 0 ]
  then
    echo "Something went wrong!"
    exit 1
fi 

TABLE_EXISTS=`aws dynamodb list-tables | grep \"${TABLENAME}\"`

if [ -z "$TABLE_EXISTS" ]
  then
    echo "Table does not exist, creating it ..."
    aws dynamodb create-table --table-name=${TABLENAME} --attribute-definitions AttributeName=${MAINKEY},AttributeType=S --key-schema AttributeName=${MAINKEY},KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
    sleep 5
    echo "Table created, REMEMBER TO ENABLE AUTO-SCALING CAPACITY from AWS console!!!"
fi

echo "Pushing data ..."

n=25          	#only 25 files can be processed as batch
for ((i=0; i < ${#files[@]}; i+=n)); do
	(echo "["; for f in "${files[@]:i:n}"; do (cat "$f"; echo ","); done; echo "]") | json-dynamo-putrequest --beautify ${TABLENAME} > dynamo-input/dynamo_"$i".json
done
dynamo_files=(dynamo-input/*.json)
for d in "${dynamo_files[@]}"; do
    aws dynamodb batch-write-item --request-items file://$d  
done

# For aligning using S3 bucket
# if [ $# -eq 2 ]
#   then
#     echo "Going to align email_templates/"${2}" on "${TABLENAME}
#       cd ../../tools/push_tables_s3
#       ./run.sh ${TABLENAME} email_templates/${2}
#     echo "Uploaded to S3!"
#   else
#     echo "Did not upload to S3!"
# fi   