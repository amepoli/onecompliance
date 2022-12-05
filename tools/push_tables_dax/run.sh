#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Please provide the target environment [gorico_prod, gorico_dev, xxx_prod, xxx_dev]"
    exit 0
fi

if [ ! -f ../../${1}.json ]; then
    echo "Target not found!"
    exit 0
fi

if [ -f ./index.mjs.ori ]; then
    echo "Something wrong with your environment, found index.mjs.ori !"
    exit 0
fi

LAMBDANAME=`cat ../../${1}.json | jq -r ".lambdas.menu.lambdaName"`

DYN_USERSNAME=`cat ../../${1}.json | jq -r ".dynamoTables.users.tableName"`
DYN_PROFILESNAME=`cat ../../${1}.json | jq -r ".dynamoTables.profiles.tableName"`
DYN_MERGED_PROFILESNAME=`cat ../../${1}.json | jq -r ".dynamoTables.merged_profiles.tableName"`
DYN_VIEWSNAME=`cat ../../${1}.json | jq -r ".dynamoTables.views.tableName"`
DYN_NAVIGATIONNAME=`cat ../../${1}.json | jq -r ".dynamoTables.navigation.tableName"`

DAX_ENDPOINT=`cat ../../${1}.json | jq -r ".dax.endpoint"`
DAX_ENABLED=`cat ../../${1}.json | jq -r ".dax.enabled"`

#replace Variables
cp index.mjs index.mjs.ori

sed -i -e "s/USERS_NAME/${DYN_USERSNAME}/g" index.mjs
sed -i -e "s/PROFILES_NAME/${DYN_PROFILESNAME}/g" index.mjs
sed -i -e "s/MERGED_PROFILESNAME/${DYN_MERGED_PROFILESNAME}/g" index.mjs
sed -i -e "s/VIEWS_NAME/${DYN_VIEWSNAME}/g" index.mjs
sed -i -e "s/NAVIGATION_NAME/${DYN_NAVIGATIONNAME}/g" index.mjs

sed -i -e "s/DAX_ENDPOINT/${DAX_ENDPOINT}/g" index.mjs
sed -i -e "s/DAX_ENABLED/${DAX_ENABLED}/g" index.mjs

rm index.mjs-e

npm install

#restore the original file

node --harmony-top-level-await index.mjs ${2}

mv index.mjs.ori index.mjs
