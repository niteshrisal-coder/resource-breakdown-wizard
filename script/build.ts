// Simple build script that just runs TypeScript compiler
import { execSync } from "child_process";

console.log("Building for production...");
execSync("npx tsc", { stdio: "inherit" });
console.log("Build completed!");
