#/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_dev, xxx_prod, xxx_dev]"
    exit 0
fi

rm appdata.json
ln -s $1.json appdata.json

#APINAME=`cat app_data.json | jq -r ".apiName"`

#compile application
npm run build-prod
#delete current distribution
aws s3 rm s3://gorico2.cloud/$1 --recursive
#upload files
aws s3 cp ./dist s3://gorico2.cloud/$1 --recursive --acl public-read
