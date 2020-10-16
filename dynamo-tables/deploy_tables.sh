#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_dev, xxx_prod, xxx_dev]"
    exit 0
fi

cd navigation
echo "Deploying navigation"
./push_tables.sh $1
cd ../profiles
echo "Deploying profiles"
./push_tables.sh $1
cd ../reports
echo "Deploying reports"
./push_tables.sh $1
cd ../translation
echo "Deploying translation"
./push_tables.sh $1
cd ../users
echo "Deploying users"
./push_tables.sh $1
cd ../views
echo "Deploying views"
./push_tables.sh $1
cd ..

