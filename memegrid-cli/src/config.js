const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".memegrid");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function writeConfig(data) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function requireConfig() {
  const cfg = readConfig();
  if (!cfg || !cfg.apiKey) {
    console.error(
      "Not registered yet. Run `npx memegrid-cli install` first."
    );
    process.exit(1);
  }
  return cfg;
}

module.exports = { readConfig, writeConfig, requireConfig, CONFIG_DIR, CONFIG_FILE };
