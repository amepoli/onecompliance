#!/bin/bash
# Script to download items from DynamoDB table and save them as JSON files.

if [ $# -eq 0 ]; then
    echo "Please provide the target environment [gorico_prod, gorico_dev]"
    exit 0
fi

if [ ! -f ../../${1}.json ]; then
    echo "Target not found!"
    exit 0
fi

TABLENAME=$(jq -r ".dynamoTables.views.tableName" ../../${1}.json)
if [ $? -ne 0 ] || [ -z "$TABLENAME" ] || [ "$TABLENAME" == "null" ]; then
    echo "Something went wrong retrieving the table name!"
    exit 1
fi

MAINKEY=$(jq -r ".dynamoTables.views.mainKey" ../../${1}.json)
if [ $? -ne 0 ] || [ -z "$MAINKEY" ] || [ "$MAINKEY" == "null" ]; then
    echo "Something went wrong retrieving the main key!"
    exit 1
fi

TABLE_EXISTS=$(aws dynamodb list-tables | grep "\"${TABLENAME}\"")
if [ -z "$TABLE_EXISTS" ]; then
    echo "Table does not exist!"
    exit 1
fi

if [ ! -d "dynamo-output" ]; then
    mkdir dynamo-output
fi

echo "Pulling data from table $TABLENAME ..."

STARTKEY=""
while true; do
    if [ -z "$STARTKEY" ]; then
        RESPONSE=$(aws dynamodb scan --table-name "$TABLENAME")
    else
        echo "$STARTKEY" > startkey.json
        RESPONSE=$(aws dynamodb scan --table-name "$TABLENAME" --exclusive-start-key file://startkey.json)
        rm -f startkey.json
    fi

    if [ $? -ne 0 ]; then
        echo "Error scanning the table."
        exit 1
    fi

    echo "$RESPONSE" | jq -c '.Items[]' | while IFS= read -r ITEM; do
        FILENAME=$(echo "$ITEM" | jq -r ".${MAINKEY}.S")
        if [ -z "$FILENAME" ] || [ "$FILENAME" == "null" ]; then
            echo "Could not extract filename from item."
            continue
        fi
        # Echo the filename being processed
        echo "Processing file: $FILENAME.json"
        echo "$ITEM" | jq '.' > "dynamo-output/${FILENAME}.json"
    done

    LASTEVALKEY=$(echo "$RESPONSE" | jq -c '.LastEvaluatedKey')
    if [ "$LASTEVALKEY" == "null" ] || [ -z "$LASTEVALKEY" ]; then
        break
    else
        STARTKEY="$LASTEVALKEY"
    fi
done

echo "Data pull complete. Files saved in dynamo-output/"
