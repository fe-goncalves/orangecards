import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public/brand/exports/booster-pack.svg");
const pngPath = join(root, "public/brand/exports/booster-pack.png");
const png2xPath = join(root, "public/brand/exports/booster-pack@2x.png");

const svg = readFileSync(svgPath, "utf8");

function renderPng(width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      loadSystemFonts: true,
    },
  });
  return resvg.render().asPng();
}

writeFileSync(pngPath, renderPng(1000));
writeFileSync(png2xPath, renderPng(2000));

console.log("Exported:");
console.log(`- ${pngPath}`);
console.log(`- ${png2xPath}`);
