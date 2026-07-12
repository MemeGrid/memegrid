const fs = require("fs");
const path = require("path");

const SKILL_SRC = path.join(__dirname, "..", "skill");

function detectTargetDir(explicitTarget) {
  if (explicitTarget) return explicitTarget;

  const cwd = process.cwd();
  // Common convention: project-level Claude skills directory
  if (fs.existsSync(path.join(cwd, ".claude"))) {
    return path.join(cwd, ".claude", "skills", "memegrid");
  }
  // Generic fallback: a local skills folder next to the project
  return path.join(cwd, "skills", "memegrid");
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function installSkill(explicitTarget) {
  const target = detectTargetDir(explicitTarget);
  copyRecursive(SKILL_SRC, target);
  return target;
}

module.exports = { installSkill, detectTargetDir };
