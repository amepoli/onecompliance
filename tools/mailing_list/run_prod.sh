#!/bin/bash

aws lambda invoke \
--function-name mailing_list_prod \
--cli-binary-format raw-in-base64-out \
--payload  '' \
mailing_list.json

mailingList=`cat ./mailing_list.json`
#echo $mailingList

for row in $(echo "${mailingList}" | jq -r '.[] | @base64'); do
_jq() {
     echo ${row} | base64 --decode | jq -r ${1}
    }
    #echo $(_jq)
    aws lambda invoke \
    --function-name email_trigger_prod \
    --cli-binary-format raw-in-base64-out \
    --payload "$(_jq)" \
    result.json
done
