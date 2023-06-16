#/bin/bash

# Script used by zee to merge repo with upstream
git fetch upstream
git fetch
git switch experimental-cdk
git merge upstream/experimental-cdk
git push
