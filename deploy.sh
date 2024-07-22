#/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target application [gorico, gorico_stage]"
    exit 0
fi


if [ $1 != "gorico" ] && [ $1 != "gorico_stage" ]; then
    echo "Invalid target application. Please provide 'gorico' or 'gorico_stage'"
    exit 1
fi

#deploy only for gorico (prod)
if [ $1 == "gorico" ]; then
    if [ ! -f ${1}_prod.json ]; then
        echo "$1 not found!"
        exit 0
    fi
    #re-deploy dynamo-tables
    cd dynamo-tables
    ./deploy_tables.sh $1_prod
    cd ..
fi


#deploy only for gorico_stage
if [ $1 == "gorico_stage" ]; then
    if [ ! -f ${1}.json ]; then
        echo "$1 not found!"
        exit 0
    fi
    #re-deploy dynamo-tables
    cd dynamo-tables
    ./deploy_tables.sh $1
    cd ..
fi

#remove previous buils
rm -rf dist/*

#compile application
if [ $1 == "gorico" ]; then
    npm run build-prod
fi

if [ $1 == "gorico_stage" ]; then
    npm run build-stage
fi

#delete current distribution
aws s3 rm s3://gorico2-cdk.cloud/$1 --recursive
#upload files
aws s3 cp ./dist s3://gorico2-cdk.cloud/$1 --recursive --acl public-read
