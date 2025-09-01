#!/bin/bash


# get api key from foam-proxy repo
REPO_OWNER="luke-h1"
REPO_NAME="foam-proxy"
API_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets"

GITHUB_TOKEN=""

curl -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     -X GET \
     $API_URL
