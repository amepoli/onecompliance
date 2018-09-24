#/bin/bash
#upload files
aws s3 cp ./dist s3://gorico2.cloud --recursive --acl public-read
