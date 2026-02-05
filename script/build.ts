import { execSync } from "child_process";

console.log("Building for production...");
// Build TypeScript
execSync("npx tsc -p tsconfig.prod.json", { stdio: "inherit" });
console.log("Build completed!");
