#!/usr/bin/env bash
# Compose the static site for GitHub Pages into $1 (default: site).
#
# The layout is: root = current checkout (always the default branch in CI),
# plus one pr-<number>/ subdirectory per open pull request holding the same
# file set sourced from that PR's head. Deploy-pages replaces the whole site on
# each run, so composing main + all open PRs keeps every deployment consistent
# and removes previews of closed PRs automatically.
#
# Usage:
#   bash scripts/stage-site.sh site
set -euo pipefail

out=${1:-site}
# The root list deliberately mirrors the historical Pages content; PR trees
# are archived whole because a pathspec would break on branches that remove
# files.
site_files=(
  catalog
  index.html
  index.js
  tokens.css
  src
  docs
  README.md
  LICENSE
)

# Root content always comes from the default branch head, even when the job
# runs on a pull request merge ref; the checkout only supplies this script.
# A pathspec would break deploys if one of the listed paths ever disappeared
# from main, which is the accepted loud-failure mode for maintainer content.
git fetch --depth=1 origin "+refs/heads/main:refs/base/main"
mkdir -p "$out"
git archive refs/base/main -- "${site_files[@]}" | tar -x -C "$out/"

# Only same-repo PR heads are staged: the site origin is shared, so publishing
# fork content there would hand arbitrary scripts to a third party. Only a
# repo owner login is interpolated (logins are alnum/hyphen only).
repository_owner=${GITHUB_REPOSITORY_OWNER:?}
while IFS= read -r number; do
  # A PR whose head disappeared (e.g. branch deleted) must not take down the
  # whole deploy, so its preview is skipped instead of failing the job.
  if ! git fetch --depth=1 origin "+refs/pull/$number/head:refs/pr/$number"; then
    echo "skipping pr-$number: head ref not fetchable" >&2
    continue
  fi
  mkdir -p "$out/pr-$number"
  git archive "refs/pr/$number" | tar -x -C "$out/pr-$number"
  echo "staged preview site/pr-$number"
done < <(gh pr list --state open --json number,headRepositoryOwner --limit 100 \
  --jq '.[] | select(.headRepositoryOwner.login == "'"$repository_owner"'") | .number')
