#!/bin/bash

rm ./nodejs.zip

zip -r nodejs.zip index.js 

aws lambda update-function-code --function-name CognitoDynamoUsers --zip-file fileb://./nodejs.zip