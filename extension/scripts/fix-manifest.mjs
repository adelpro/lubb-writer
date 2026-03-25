import fs from "fs";
import path from "path";

const buildDir = path.join(process.cwd(), "build");

const targets = ["chrome-mv3-prod", "edge-mv3-prod", "firefox-mv3-prod"];

for (const target of targets) {
  const manifestPath = path.join(buildDir, target, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    continue;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  if (manifest.web_accessible_resources) {
    const originalLength = manifest.web_accessible_resources.length;

    manifest.web_accessible_resources = manifest.web_accessible_resources
      .map((war) => {
        war.resources = war.resources.filter(
          (resource) =>
            !resource.startsWith("inline.") ||
            (fs.existsSync(path.join(buildDir, target, resource)) &&
              resource.endsWith(".js"))
        );
        return war;
      })
      .filter((war) => war.resources.length > 0);

    if (manifest.web_accessible_resources.length !== originalLength) {
      console.log(`Fixed ${target} manifest: removed invalid inline.*.css and inline.*.png references`);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

console.log("Manifest fix complete");
