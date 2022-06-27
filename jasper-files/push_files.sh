#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_test, gorico_dev, xxx_prod, xxx_test, xxx_dev]"
    exit 0
fi

aws s3 cp . s3://gorico2-reports/Jasper/ --recursive --exclude "*" --include "*.jasper" --exclude "MyReports/*" 
aws s3 cp . s3://gorico2-reports/Jasper/reports/ --recursive --exclude "*" --include "*.jrxml" --exclude "MyReports/*"
aws s3 cp ./logos/. s3://gorico2-reports/Jasper/logos/ --recursive --exclude "*" --include "*.png"
sftp -i reports.key -P 5222 -b sftp.txt reports@18.197.167.37
cd ../dynamo-tables/reports/
./push_tables.sh $1
cd -