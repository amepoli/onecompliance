#!/bin/bash

# Check if a target application was provided
if [ $# -eq 0 ]; then
    echo "Please provide the target application [gorico, gorico_stage]"
    exit 0
fi

# Validate the target application
if [ $1 != "gorico" ] && [ $1 != "gorico_stage" ]; then
    echo "Invalid target application. Please provide 'gorico' or 'gorico_stage'"
    exit 1
fi

# Function to deploy DynamoDB tables (commented for testing purposes)
deploy_dynamo_tables() {
    echo "Run deploy_dynamo_tables with target: $1"
    local target=$1
    cd dynamo-tables
    echo "Deploying dynamo-tables in $target..."
    ./deploy_tables.sh $target
    cd ..
}

# Deploy for 'gorico' (prod)
if [ $1 == "gorico" ]; then
    if [ ! -f ${1}_prod.json ]; then
        echo "$1 not found!"
        exit 0
    fi
    echo "Would deploy dynamo-tables for ${1}_prod"
    deploy_dynamo_tables "${1}_prod"
fi

# Deploy for 'gorico_stage'
if [ $1 == "gorico_stage" ]; then
    if [ ! -f ${1}.json ]; then
        echo "$1 not found!"
        exit 0
    fi
    echo "Would deploy dynamo-tables for $1"
    deploy_dynamo_tables "$1"
fi

# Remove previous builds
rm -rf dist/*
echo "Previous builds removed"

# Compile application
if [ $1 == "gorico" ]; then
    echo "Would compile application for production"
    npm run build-prod
elif [ $1 == "gorico_stage" ]; then
    echo "Would compile application for stage"
    npm run build-stage
fi

# Delete current distribution from S3 (commented for testing purposes)
aws s3 rm s3://gorico2-cdk.cloud/$1 --recursive
echo "Would delete current distribution from S3: s3://gorico2-cdk.cloud/$1"

# Upload new files to S3 (commented for testing purposes)
aws s3 cp ./dist s3://gorico2-cdk.cloud/$1 --recursive --acl public-read
echo "Would upload new files to S3: s3://gorico2-cdk.cloud/$1"
