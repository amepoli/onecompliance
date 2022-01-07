#/bin/bash

# Script used by zee to merge repo with upstream
git fetch upstream
git merge upstream/master
git push
