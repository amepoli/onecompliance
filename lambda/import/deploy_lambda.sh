#!/bin/bash

rm ./nodejs.zip

zip -r nodejs.zip node_modules index.js package.json

aws lambda update-function-code --function-name import --zip-file fileb://./nodejs.zip