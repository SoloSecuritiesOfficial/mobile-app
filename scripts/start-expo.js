const { spawnSync } = require("node:child_process");

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

console.log("\n[1/3] Updating Expo-compatible dependencies...");
run(npx, ["expo", "install", "--fix"]);

console.log("\n[2/3] Checking the project with Expo Doctor...");
run(npx, ["expo-doctor"]);

console.log("\n[3/3] Starting Expo...");
run(npx, ["expo", "start"]);
