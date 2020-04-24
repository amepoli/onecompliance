#!/bin/bash
aws s3 cp . s3://gorico2.reports/Jasper/ --recursive --exclude "*" --include "*.jasper" --exclude "MyReports/*" 
aws s3 cp . s3://gorico2.reports/Jasper/reports/ --recursive --exclude "*" --include "*.jrxml" --exclude "MyReports/*"
aws s3 cp ./logos/. s3://gorico2.reports/Jasper/logos/ --recursive --exclude "*" --include "*.png"