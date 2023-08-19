#!/bin/bash

aws lambda invoke \
--function-name mailing_list_CDK_prod \
--cli-binary-format raw-in-base64-out \
--payload  '{"mode": "test"}' \
--cli-read-timeout 0 \
mailing_list.json

mailingList=`cat ./mailing_list.json`
#echo $mailingList

for row in $(echo "${mailingList}" | jq -r '.[] | @base64'); do
_jq() {
     echo ${row} | base64 --decode | jq -r ${1}
    }
    #echo $(_jq)
    aws lambda invoke \
    --function-name email_trigger_CDK_prod \
    --cli-binary-format raw-in-base64-out \
    --payload "$(_jq)" \
    result.json
done

#Stoiricizzo i valori sul database (commentato poichè psql non installato su questo sistema)
#psql -h onecompliance-aurora.caxbbckt9xen.eu-central-1.rds.amazonaws.com -U postgres -d Gorico -c "select entrasp.insert_val_ind_report_mail();"