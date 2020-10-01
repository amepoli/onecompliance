#/bin/bash
#compile application
npm run build-prod
#delete current distribution
aws s3 rm s3://gorico2.cloud/ --recursive
#upload files
aws s3 cp ./dist s3://gorico2.cloud --recursive --acl public-read
