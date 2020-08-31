#!/usr/bin/env bash

# remove an out-of-date oauth git environment.

# Thank goodness for SO:
# https://stackoverflow.com/questions/53452910/how-to-remove-a-github-environment

# install jq first:
# sudo apt install jq

# make sure you've got a token:
# https://github.com/settings/tokens

env="<old-env>"  # environment to remove
token="<shiny-token>"
repo="this-repo"
user="you"

for id in $(curl -u $user:$token https://api.github.com/repos/$user/$repo/deployments\?environment\=$env | jq ".[].id"); do
    curl -X POST -u $user:$token -d '{"state":"inactive"}' -H 'accept: application/vnd.github.ant-man-preview+json' https://api.github.com/repos/$user/$repo/deployments/$id/statuses
    curl -X DELETE -u $user:$token https://api.github.com/repos/$user/$repo/deployments/$id
done
