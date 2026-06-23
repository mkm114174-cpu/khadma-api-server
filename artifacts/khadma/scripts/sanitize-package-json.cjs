const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const deps = pkg.dependencies ?? {};

for (const key of ["expo", "react", "react-native"]) {
  if (key in deps) delete deps[key];
}

pkg.dependencies = deps;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
