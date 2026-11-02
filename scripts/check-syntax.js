import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import ejs from "ejs";

let checked = 0;
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (file.endsWith(".js")) {
      const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
      if (result.status !== 0) throw new Error(result.stderr);
      checked++;
    } else if (file.endsWith(".ejs")) {
      ejs.compile(readFileSync(file, "utf8"), { filename: file });
      checked++;
    }
  }
}
check(".");
console.log(`Syntax checks passed for ${checked} JavaScript files and EJS templates.`);
