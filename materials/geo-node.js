// Node runner: loads assets/geo-sample.js and assets/geo-live.js exactly as the browser does and
// prints the canon as JSON. Compare with: python3 materials/geo_reference.py <repo>
//   node materials/geo-node.js <repo> [--plant]     --plant corrupts the SVY21 false easting first and
//                                                    prints the self-test result, which must then FAIL
const fs = require("fs"), path = require("path"), vm = require("vm");
const repo = process.argv[2] || path.join(__dirname, "..");
const ctx = { window: {} }; ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(repo, "assets/geo-sample.js"), "utf8"), ctx);
const api = require(path.join(path.resolve(repo), "assets/geo-live.js"));
if (process.argv.includes("--plant")) {
  const ok0 = api.selfTest();
  const keep = api.P.FE; api.P.FE += 1;
  const bad = api.selfTest(); api.P.FE = keep;
  process.stdout.write(JSON.stringify({ clean: ok0, planted: bad }) + "\n");
} else {
  process.stdout.write(JSON.stringify(api.canon(ctx.window.GEO_SAMPLE), null, 1));
}
