import crypto from 'node:crypto';

// Unambiguous 32-character alphabet (excludes 0, O, 1, I to prevent human confusion)
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function getSecretKey() {
  const rawSecret = process.env.JWT_SECRET || process.env.VERIFICATION_SECRET || 'foodbridge_verification_fallback_secret_32bytes!';
  // Derive a 32-byte key using sha256
  return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Generates an unambiguous cryptographically random 6-character code.
 * Example: "K7P9M2"
 */
export function generateVerificationCode(length = CODE_LENGTH) {
  let result = '';
  const charsetLen = CODE_CHARSET.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charsetLen);
    result += CODE_CHARSET[randomIndex];
  }
  return result;
}

/**
 * Cleans user or scanner input: trims whitespace, removes hyphens/spaces, forces uppercase.
 */
export function sanitizeCode(code) {
  if (!code || typeof code !== 'string') return '';
  return code.trim().replace(/[\s-]+/g, '').toUpperCase();
}

/**
 * Validates that the input conforms to the 6-character alphanumeric pattern.
 */
export function isValidCodeFormat(code) {
  const clean = sanitizeCode(code);
  return /^[A-Z0-9]{6}$/.test(clean);
}

/**
 * Computes a deterministic HMAC-SHA256 hash using the server secret key.
 * Used for O(1) indexed database lookups without leaking plaintext in DB backups.
 */
export function hashVerificationCode(code) {
  const clean = sanitizeCode(code);
  if (!clean) return null;
  const secret = getSecretKey();
  return crypto.createHmac('sha256', secret).update(clean).digest('hex');
}

/**
 * Encrypts the plaintext code for safe storage at rest using AES-256-GCM.
 * Only the server with the environment secret can decrypt this for the authenticated receiver.
 */
export function encryptVerificationCode(code) {
  const clean = sanitizeCode(code);
  if (!clean) return null;

  const key = getSecretKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(clean, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted verification code for display on receiver's digital pass.
 */
export function decryptVerificationCode(encryptedPayload) {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') return null;

  // If unencrypted legacy string
  if (!encryptedPayload.includes(':')) {
    return sanitizeCode(encryptedPayload);
  }

  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getSecretKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return sanitizeCode(decrypted);
  } catch (err) {
    console.error('Failed to decrypt verification code payload:', err.message);
    return null;
  }
}
