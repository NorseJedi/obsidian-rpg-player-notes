#!/usr/bin/env bash

# Colors
readonly BLACK='\033[0;30m'
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly LIGHTGREY='\033[0;37m'
readonly GREY='\033[0;90m'
readonly LIGHTRED='\033[0;91m'
readonly LIGHTGREEN='\033[0;92m'
readonly LIGHTYELLOW='\033[0;93m'
readonly LIGHTBLUE='\033[0;94m'
readonly LIGHTMAGENTA='\033[0;95m'
readonly LIGHTCYAN='\033[0;96m'
readonly WHITE='\033[0;97m'
readonly NC='\033[0m' # No Color

# Logging functions with colors
log_info() {
    printf "${BLUE}[INFO]${NC} %s\n" "$1"
}

log_success() {
    printf "${GREEN}[SUCCESS]${NC} %s\n" "$1"
}

log_warning() {
    printf "${YELLOW}[WARNING]${NC} %s\n" "$1"
}

log_error() {
    printf "${RED}[ERROR]${NC} %s\n" "$1" >&2
}

if [[ ! -x $(which jq) ]]; then
    log_error "jq not found"
    exit 0
fi
if [[ ! -x $(which sponge) ]]; then
    log_error "sponge not found"
    exit 0
fi

current_version=$(jq -r .version package.json)
log_info "Current version is $current_version"

if [[ -z $1 ]]; then
    log_info "Usage: $0 <major|minor|patch>"
    exit 0
fi

exit_if_error() {
    if [[ $1 != 0 ]]; then
        log_error "Exiting due to error"
        exit $1
    fi
}

do_release() {
    log_info "Updating version number in package.json"
    jq --tab ".version = \"$new_version\"" package.json | sponge package.json
    exit_if_error $?

    log_info "Updating version number in manifest.json and versions.json"
    node version-bump.mjs
    exit_if_error $?

    log_info "Commiting package.json manifest.json and versions.json"
    git add package.json manifest.json versions.json && git commit --quiet -m "Release $new_version"
    exit_if_error $?

    log_info "Adding tag: $new_version"
    git tag -a $new_version -m $new_version
    exit_if_error $?

    log_info "Pushing to github"
    git push --quiet
    exit_if_error $?

    log_success "Done."
}

IFS=. read -r major minor patch <<EOF
$current_version
EOF
case "$1" in
    "major")
        new_version="$((major+1)).0.0";
        ;;
    "minor")
        new_version="$major.$((minor+1)).0";
        ;;
    "patch")
        new_version="$major.$minor.$((patch+1))";
        ;;
esac

log_info "This will create a tag $new_version on the current commit and push it to github."
read -p $'\e[34m[INFO]\e[0m Continue? [y/N] ' -n 1 -r response
echo
case $response in
    [yY][eE][sS]|[yY])
        do_release
        ;;
    *)
        log_warning "Aborted"
        exit 0
        ;;
esac
