#!/bin/bash
#run 'npm install --global json-dynamo-putrequest' before launching the script the first time 

arn="arn:aws:lambda:eu-central-1:360720986746:function:email_trigger"

files=(*.json)
n=25          	#only 25 files can be processed as batch
for ((i=0; i < ${#files[@]}; i+=n)); do
	(echo "["; for f in "${files[@]:i:n}"; do (cat "$f"; echo ","); done; echo "]") | json-dynamo-putrequest --beautify email_templates > dynamo-input/dynamo_"$i".json
done

for ((i=0; i < ${#files[@]}; i++)); do
    id=$((${i}+1))
    
    # Get name of file
    name=${files[i]%".json"}
    
    # Create Target Constant Input
    targetInput="{\"templateKey\": \"${name}\"}"
    #echo $targetInput
    
    # Load frequency
    while read frequency; do echo $frequency; done < frequency/${name}.txt
    rate="rate(${frequency})"
    #echo $rate
    
    # Remove rule, permission and targets
    aws events remove-targets --rule ${name}_schedule_rule --ids "1"
    aws lambda remove-permission --function-name email_trigger --statement-id ${name}_scheduled_event
    aws events delete-rule --name ${name}_schedule_rule

    # Add rule, permission and targets
    aws events put-rule --name ${name}_schedule_rule --schedule-expression "${rate}"
    aws lambda add-permission --function-name email_trigger --statement-id ${name}_scheduled_event --action 'lambda:InvokeFunction' --principal events.amazonaws.com --source-arn arn:aws:events:eu-central-1:360720986746:rule/${name}_schedule_rule
    #aws events put-targets --rule ${name}_schedule_rule --targets file://targets/$name.json
    aws events put-targets --rule ${name}_schedule_rule --targets "Id"="1","Arn"="$arn","Input"="'$targetInput'"
done
echo "Email trigger schedule added successfully!"


#aws events remove-targets --rule email_trigger-schedule-rule --ids "1"
#aws lambda remove-permission --function-name email_trigger --statement-id email_trigger-scheduled-event
#aws events delete-rule --name email_trigger-schedule-rule


#aws events put-rule --name email_trigger-schedule-rule --schedule-expression 'rate(5 days)'
#aws lambda add-permission --function-name email_trigger --statement-id email_trigger-scheduled-event --action 'lambda:InvokeFunction' --principal events.amazonaws.com --source-arn arn:aws:events:eu-central-1:360720986746:rule/email_trigger-schedule-rule
##aws events put-targets --rule email_trigger-schedule-rule --targets file://targets/target.json
#aws events put-targets --rule email_trigger-schedule-rule --targets "Id"="1","Arn"="arn:aws:lambda:eu-central-1:360720986746:function:email_trigger"

