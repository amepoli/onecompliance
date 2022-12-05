#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target table name [profiles, profiles_prod, tables, tables_prod...]"
    exit 0
fi


if [ $# -eq 1 ]
  then
    echo "Please provide the complete path of dynamo-table like 'profiles/admin'"
    exit 0
fi

node --harmony-top-level-await index.mjs ${1} ${2}

aws lambda invoke \
--function-name navigation \
--cli-binary-format raw-in-base64-out \
--payload  '{ "S3Record": {"Key": "'${1}'/'${2}'.json", "Table": "'${1}'"}}' \
result.json
