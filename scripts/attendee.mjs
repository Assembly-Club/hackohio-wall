// Shared rules for attendees/<username>.json, used by the PR check and the build.

export const USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

// Returns { errors: string[], entry } — entry is the cleaned data when there are no errors.
export function validateEntry(data) {
  const errors = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { errors: ['The file should be one JSON object: { "name": "...", "building": "...", "site": "..." }'] };
  }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) errors.push('"name" is missing. Add "name": "Your Name".');
  else if (name.length > 80) errors.push('"name" is too long (80 characters max).');
  else if (name === "Your Name") errors.push('"name" still says "Your Name". Put your real name in.');

  let building = "";
  if (data.building !== undefined) {
    if (typeof data.building !== "string") errors.push('"building" should be text in quotes.');
    else building = data.building.trim();
    if (building.length > 200) errors.push('"building" is too long (200 characters max).');
  }

  let site = "";
  if (data.site !== undefined && data.site !== "") {
    if (typeof data.site !== "string") {
      errors.push('"site" should be a URL in quotes.');
    } else {
      site = data.site.trim();
      if (site.includes("<") || site.includes(">")) {
        errors.push('"site" still has <username> in it. Replace it with your GitHub username.');
      } else {
        let url = null;
        try { url = new URL(site); } catch (_) { /* reported below */ }
        if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) {
          errors.push('"site" should be a full link starting with https://');
        } else if (site.length > 300) {
          errors.push('"site" is too long.');
        }
      }
    }
  }

  return errors.length ? { errors } : { errors, entry: { name, building, site } };
}
