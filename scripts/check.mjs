// PR check: the PR must add exactly one file, attendees/<author>.json, with valid contents.
// Runs from the base repo's main branch (pull_request_target) and only *reads* the PR's
// file through the API — it never checks out or runs code from the PR.

import { appendFileSync } from "node:fs";
import { validateEntry } from "./attendee.mjs";

const { GITHUB_TOKEN, REPO, PR_NUMBER, PR_AUTHOR, HEAD_REPO, HEAD_SHA, GITHUB_STEP_SUMMARY } = process.env;
const expected = `attendees/${PR_AUTHOR}.json`;

async function gh(path, accept = "application/vnd.github+json") {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: accept, "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}`);
  return accept.endsWith("raw") ? res.text() : res.json();
}

function report(errors) {
  const ok = errors.length === 0;
  const lines = ok
    ? [`## ✅ Looks good, @${PR_AUTHOR}!`, "", "Your file is valid. Don't merge it yourself — we'll merge everyone live on the big screen."]
    : [
        `## ❌ Almost there, @${PR_AUTHOR}`,
        "",
        ...errors.map((e) => `- ${e}`),
        "",
        `Fix \`${expected}\` in your fork, then \`git commit -am "Fix my wall entry"\` and \`git push\`. This check re-runs on its own.`,
        "",
        "Your file should look like this:",
        "```json",
        "{",
        '  "name": "Your Name",',
        '  "building": "what you\'re hacking on this weekend",',
        `  "site": "https://${PR_AUTHOR}.github.io/hackohio-site"`,
        "}",
        "```",
      ];
  if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  for (const e of errors) console.log(`::error title=Wall entry::${e}`);
  console.log(ok ? "Wall entry OK" : `${errors.length} problem(s) found`);
  process.exit(ok ? 0 : 1);
}

const files = await gh(`/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100`);
const errors = [];

if (files.length !== 1) {
  errors.push(`Your PR should change exactly one file, \`${expected}\`. It changes ${files.length}: ${files.map((f) => `\`${f.filename}\``).join(", ")}.`);
  report(errors);
}

const [file] = files;
if (!file.filename.startsWith("attendees/")) {
  errors.push(`Your file is at \`${file.filename}\`. It needs to be in the \`attendees/\` folder: \`${expected}\`.`);
} else if (file.filename.toLowerCase() !== expected.toLowerCase()) {
  errors.push(`Name the file after your GitHub username: \`${expected}\` (yours is \`${file.filename}\`).`);
}
if (file.status === "removed") errors.push("Your PR deletes a file. It should add your own.");
if (errors.length) report(errors);

if (!HEAD_REPO) report([`Couldn't read your fork. Was it deleted? Re-fork and open a new PR.`]);
const raw = await gh(`/repos/${HEAD_REPO}/contents/${file.filename}?ref=${HEAD_SHA}`, "application/vnd.github.raw");
if (raw.length > 2000) report(["Your file is too big. It only needs name, building and site."]);

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  report([`That isn't valid JSON (${err.message}). Check for a missing quote, a missing comma between lines, or an extra comma after the last line.`]);
}
report(validateEntry(data).errors);
