import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "data");

for (const f of ["listings-types.ts", "listings-data.ts", "listings.ts"]) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    console.error("missing", p);
    process.exit(1);
  }
}

const data = fs.readFileSync(path.join(root, "listings-data.ts"), "utf8");
const types = fs.readFileSync(path.join(root, "listings-types.ts"), "utf8");
const count = (data.match(/id: "/g) ?? []).length;

const report = {
  count,
  sampleGeorgian: data.includes('name: "ლუკა"'),
  hasReplacement: data.includes("\uFFFD"),
  serverOnly: data.startsWith('import "server-only"'),
  typesHasCenter: types.includes("GEORGIA_CENTER"),
};

console.log(JSON.stringify(report, null, 2));
if (count !== 3000) process.exit(1);
