const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE = "shorturl_session";

function normalizeBase64Url(input: string) {
  return input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
}

export function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string) {
  const binary = atob(normalizeBase64Url(value));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function randomToken(bytes = 16) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return base64UrlEncode(values);
}

async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function timingSafeBytesEqual(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
}

export async function secureCompareText(left: string, right: string) {
  const [leftDigest, rightDigest] = await Promise.all([sha256(left), sha256(right)]);
  return timingSafeBytesEqual(leftDigest, rightDigest);
}

async function hmacSha256(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

async function sign(value: string, secret: string) {
  return base64UrlEncode(await hmacSha256(value, secret));
}

export async function hashPassword(password: string) {
  const salt = randomToken(16);
  const digest = base64UrlEncode(await sha256(`${salt}:${password}`));
  return `sha256:${salt}:${digest}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [, salt, expectedDigest] = storedHash.split(":");
  if (!salt || !expectedDigest) {
    return false;
  }

  const digest = base64UrlEncode(await sha256(`${salt}:${password}`));
  return secureCompareText(digest, expectedDigest);
}

export async function createSessionCookie(secret: string, requestUrl: string) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${crypto.randomUUID()}.${expiresAt}`;
  const payloadToken = base64UrlEncode(encoder.encode(payload));
  const signature = await sign(payload, secret);
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";

  return `${SESSION_COOKIE}=${payloadToken}.${signature}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function verifySessionCookie(cookieValue: string | undefined, secret: string) {
  if (!cookieValue) {
    return false;
  }

  const [payloadToken, signature] = cookieValue.split(".");
  if (!payloadToken || !signature) {
    return false;
  }

  try {
    const payload = decoder.decode(base64UrlDecode(payloadToken));
    const expectedSignature = await sign(payload, secret);
    const [, expiresAtValue] = payload.split(".");
    const expiresAt = Number(expiresAtValue);

    return Number.isFinite(expiresAt) && expiresAt > Date.now() && (await secureCompareText(signature, expectedSignature));
  } catch {
    return false;
  }
}

export function getCookie(header: string | null, name: string) {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return rawValue.join("=");
    }
  }

  return undefined;
}
