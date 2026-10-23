// Builds the static site into _site/: copies the page + assets and compiles
// attendees/*.json into a single attendees.json the page polls.
// Invalid files are skipped with a warning so one bad merge can't break the deploy.
//
//   node scripts/build.mjs [outDir]

import { readdirSync, readFileSync, mkdirSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { USERNAME, validateEntry } from "./attendee.mjs";

const out = process.argv[2] || "_site";

// When the file landed on main (squash merges make this the merge time).
function addedAt(file) {
  try {
    const iso = execFileSync("git", ["log", "--diff-filter=A", "--follow", "--format=%cI", "-1", "--", file], { encoding: "utf8" }).trim();
    if (iso) return iso;
  } catch (_) { /* not a git checkout */ }
  return new Date().toISOString();
}

const attendees = [];
for (const file of readdirSync("attendees").sort()) {
  if (!file.endsWith(".json")) continue;
  const username = file.slice(0, -5);
  const path = join("attendees", file);
  if (!USERNAME.test(username)) {
    console.warn(`skip ${path}: filename isn't a GitHub username`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.warn(`skip ${path}: invalid JSON (${err.message})`);
    continue;
  }
  const { errors, entry } = validateEntry(data);
  if (errors.length) {
    console.warn(`skip ${path}: ${errors.join(" ")}`);
    continue;
  }
  attendees.push({ username, ...entry, mergedAt: addedAt(path) });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync("index.html", join(out, "index.html"));
cpSync("assets", join(out, "assets"), { recursive: true });
writeFileSync(join(out, "attendees.json"), JSON.stringify(attendees, null, 2));
console.log(`built ${out}/ with ${attendees.length} attendee(s)`);
