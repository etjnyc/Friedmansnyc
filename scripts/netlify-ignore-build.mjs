import { execFileSync } from "node:child_process";

const cached = process.env.CACHED_COMMIT_REF || "";
const current = process.env.COMMIT_REF || "";

// Allow intentional manual/clean-cache builds and any case where Netlify does
// not provide a useful comparison range.
if (!cached || !current || cached === current) {
  process.exit(1);
}

let changed = [];
try {
  changed = execFileSync("git", ["diff", "--name-only", cached, current], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
} catch {
  // Fail open so a comparison problem can never suppress a real portal deploy.
  process.exit(1);
}

const ignored = (file) =>
  file === ".DS_Store" ||
  file.endsWith("/.DS_Store") ||
  file === ".gitignore" ||
  file.endsWith(".md") ||
  file.startsWith("dist/") ||
  file.startsWith("node_modules/");

const siteChanges = changed.filter((file) => !ignored(file));

// Netlify ignore command semantics: exit 0 = skip build, exit 1 = build.
process.exit(siteChanges.length === 0 ? 0 : 1);
