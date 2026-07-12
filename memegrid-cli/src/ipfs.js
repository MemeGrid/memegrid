const fs = require("fs");
const path = require("path");

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB hard limit
const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Validate a local logo file: extension, size (<= 3MB).
 * Throws with a human-readable message on failure.
 */
function validateLogoFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Logo file not found: ${filePath}`);
  }
  const ext = path.extname(filePath).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error(
      `Unsupported logo format "${ext}". Allowed: ${ALLOWED_EXT.join(", ")}`
    );
  }
  const { size } = fs.statSync(filePath);
  if (size > MAX_BYTES) {
    const mb = (size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Logo file is ${mb}MB, which exceeds the 3MB limit. Compress or resize it first.`
    );
  }
  return { ext, size, mime: MIME_BY_EXT[ext] };
}

/**
 * Upload a validated logo file to IPFS via a pinning service.
 * Requires PINATA_JWT in the environment. Returns { cid, gatewayUrl, ipfsUri }.
 */
async function uploadLogoToIPFS(filePath) {
  const { mime } = validateLogoFile(filePath);

  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error(
      "PINATA_JWT is not set. Get a JWT from pinata.cloud and export it as an environment variable before deploying."
    );
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const blob = new Blob([fileBuffer], { type: mime });

  const form = new FormData();
  form.append("file", blob, fileName);
  form.append(
    "pinataMetadata",
    JSON.stringify({ name: `memegrid-logo-${fileName}` })
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`IPFS upload failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const cid = data.IpfsHash;
  return {
    cid,
    ipfsUri: `ipfs://${cid}`,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
  };
}

module.exports = { validateLogoFile, uploadLogoToIPFS, MAX_BYTES, ALLOWED_EXT };
