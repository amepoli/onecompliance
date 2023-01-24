#!/bin/bash

aws lambda invoke \
--function-name mailing_list \
--cli-binary-format raw-in-base64-out \
--payload  '' \
mailing_list.json

mailingList=`cat ./mailing_list.json`
echo $mailingList

aws lambda invoke \
--function-name email_trigger \
--cli-binary-format raw-in-base64-out \
--payload "$mailingList" \
result.json

