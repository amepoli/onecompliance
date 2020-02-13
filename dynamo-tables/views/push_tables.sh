#!/bin/bash
#run 'npm install --global json-dynamo-putrequest' before launching the script the first time 
files=(*.json)
n=25          	#only 25 files can be processed as batch
for ((i=0; i < ${#files[@]}; i+=n)); do
	(echo "["; for f in "${files[@]:i:n}"; do (cat "$f"; echo ","); done; echo "]") | json-dynamo-putrequest --beautify views > dynamo-input/dynamo_"$i".json
done
dynamo_files=(dynamo-input/*.json)
for d in "${dynamo_files[@]}"; do
    aws dynamodb batch-write-item --request-items file://$d  
done