#!/bin/bash

aws lambda invoke \
--function-name dbf_to_csv_converter \
--cli-binary-format raw-in-base64-out \
--payload '{ "bucket": "gorico2-migration", "folder": "batch/finafarm/upload" }' \
result.json
