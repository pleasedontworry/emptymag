const ADMIN_COOKIE_NAME = "admin_session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Не задана переменная окружения ${name}`);
  }

  return value;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  if (hex.length % 2 !== 0) {
    throw new Error("Некорректный hex");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }

  return bytes;
}

async function signPayload(payload: string, secret: string) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return bytesToHex(new Uint8Array(signature));
}

export function getAdminCookieName() {
  return ADMIN_COOKIE_NAME;
}

export function getAdminCredentials() {
  return {
    login: getEnv("ADMIN_LOGIN"),
    password: getEnv("ADMIN_PASSWORD"),
    secret: getEnv("ADMIN_COOKIE_SECRET"),
  };
}

export async function createAdminSessionToken(login: string) {
  const { secret } = getAdminCredentials();

  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${login}:${expiresAt}`;
  const payloadHex = bytesToHex(new TextEncoder().encode(payload));
  const signatureHex = await signPayload(payload, secret);

  return `${payloadHex}.${signatureHex}`;
}

export async function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadHex, signatureHex] = parts;

  try {
    const payloadBytes = hexToBytes(payloadHex);
    const payload = new TextDecoder().decode(payloadBytes);

    const expectedSignature = await signPayload(
      payload,
      getAdminCredentials().secret
    );

    if (signatureHex !== expectedSignature) {
      return false;
    }

    const [login, expiresAtRaw] = payload.split(":");

    if (!login || !expiresAtRaw) {
      return false;
    }

    const expiresAt = Number(expiresAtRaw);

    if (Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}