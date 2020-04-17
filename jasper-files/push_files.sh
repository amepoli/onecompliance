#!/bin/bash
aws s3 cp . s3://gorico2.reports/Jasper/ --recursive --exclude "*" --include "*.jasper" --include "*.jrxml" --exclude "MyReports/*" 