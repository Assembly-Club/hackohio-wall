#!/usr/bin/env bash
# Finale helper: squash-merge every open PR whose checks all passed, oldest first.
# Run it from this repo's folder; run it again to pick up stragglers.
set -euo pipefail

gh pr list --state open --limit 200 --json number,author,statusCheckRollup \
  --jq 'sort_by(.number) | .[] | select((.statusCheckRollup | length) > 0 and all(.statusCheckRollup[]; .conclusion == "SUCCESS")) | "\(.number) \(.author.login)"' |
while read -r number login; do
  echo "Merging #$number (@$login)"
  gh pr merge "$number" --squash --subject "Add @$login to the wall" || echo "  skipped #$number"
done
