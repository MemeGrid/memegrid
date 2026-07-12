const API_BASE = process.env.MEMEGRID_API_BASE || "https://api.memegrid.xyz/v1";

async function request(pathName, { method = "GET", apiKey, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${API_BASE}${pathName}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message = data.message || data.error || res.statusText;
    const err = new Error(`Memegrid API error (${res.status}): ${message}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

module.exports = {
  register: (name) => request("/agents/register", { method: "POST", body: { name } }),
  deploy: (apiKey, payload) => request("/deploy", { method: "POST", apiKey, body: payload }),
  claim: (apiKey, tokenAddress) =>
    request("/claim", { method: "POST", apiKey, body: tokenAddress ? { token_address: tokenAddress } : {} }),
  tokens: (apiKey) => request("/tokens", { apiKey }),
  balance: (apiKey) => request("/balance", { apiKey }),
  setPayoutAddress: (apiKey, address) =>
    request("/agents/me/payout-address", { method: "PUT", apiKey, body: { address } }),
};
