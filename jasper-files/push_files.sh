#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_test, gorico_dev, xxx_prod, xxx_test, xxx_dev]"
    exit 0
fi

if [ $1 == "gorico_prod" ]
  then
    ssh-keygen -f "$HOME/.ssh/known_hosts" -R "[18.193.201.111]:5222"
    sftp -o "StrictHostKeyChecking=no" -i reports.key -P 5222 reports@18.193.201.111 <<EOF
exit
EOF
    HOSTNAME="18.193.201.111"
else
    ssh-keygen -f "$HOME/.ssh/known_hosts" -R "[3.124.34.69]:5222"
    sftp -o "StrictHostKeyChecking=no" -i reports.key -P 5222 reports@3.124.34.69 <<EOF
exit
EOF
    HOSTNAME="3.124.34.69"
fi

aws s3 cp . s3://gorico2-reports/Jasper/ --recursive --exclude "*" --include "*.jasper" --exclude "MyReports/*" 
aws s3 cp . s3://gorico2-reports/Jasper/reports/ --recursive --exclude "*" --include "*.jrxml" --exclude "MyReports/*"
aws s3 cp ./logos/. s3://gorico2-reports/Jasper/logos/ --recursive --exclude "*" --include "*.png"
sftp -i reports.key -o "StrictHostKeyChecking=no" -P 5222 -b sftp.txt reports@"$HOSTNAME"
cd ../dynamo-tables/reports/
./push_tables.sh $1
cd -
