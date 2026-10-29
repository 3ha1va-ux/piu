import { mkdirSync, readdirSync, writeFileSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoDir = path.join(root, "public", "demo");
const outDir = path.join(demoDir, "icons");

mkdirSync(outDir, { recursive: true });

const files = readdirSync(demoDir).filter((f) =>
  /\.(jpe?g|png|webp)$/i.test(f),
);

for (const file of files) {
  const input = path.join(demoDir, file);
  const base = file.replace(/\.\w+$/, "");
  const out = path.join(outDir, `${base}.avif`);
  const buf = await sharp(input)
    .rotate()
    .resize({ width: 72, height: 72, fit: "cover", position: "attention" })
    .avif({ quality: 38, effort: 4 })
    .toBuffer();
  writeFileSync(out, buf);
  const kb = (statSync(out).size / 1024).toFixed(1);
  console.log(`${base}.avif → ${kb} KB`);
}

console.log(`Done: ${files.length} icons in public/demo/icons`);
