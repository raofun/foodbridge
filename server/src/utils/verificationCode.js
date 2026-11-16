import crypto from 'node:crypto';

// Unambiguous alphabet excluding lookalikes (0, O, 1, I)
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function getSecretKey() {
  const rawSecret = process.env.JWT_SECRET || process.env.VERIFICATION_SECRET || 'foodbridge_verification_fallback_secret_32bytes!';
  return crypto.createHash('sha256').update(rawSecret).digest();
}

// Generate random 6-character pickup verification code
export function generateVerificationCode(length = CODE_LENGTH) {
  let result = '';
  const charsetLen = CODE_CHARSET.length;
  for (let i = 0; i < length; i++) {
    result += CODE_CHARSET[crypto.randomInt(0, charsetLen)];
  }
  return result;
}

// Clean user/scanner input: uppercase, strip whitespace & hyphens
export function sanitizeCode(code) {
  if (!code || typeof code !== 'string') return '';
  return code.trim().replace(/[\s-]+/g, '').toUpperCase();
}

// Verify 6-character alphanumeric pattern
export function isValidCodeFormat(code) {
  return /^[A-Z0-9]{6}$/.test(sanitizeCode(code));
}

// HMAC-SHA256 hash for fast O(1) indexed lookup without plaintext exposure
export function hashVerificationCode(code) {
  const clean = sanitizeCode(code);
  if (!clean) return null;
  return crypto.createHmac('sha256', getSecretKey()).update(clean).digest('hex');
}

// AES-256-GCM authenticated encryption for storage at rest
export function encryptVerificationCode(code) {
  const clean = sanitizeCode(code);
  if (!clean) return null;

  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(clean, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// Decrypt verification code for authorized receiver digital pass
export function decryptVerificationCode(encryptedPayload) {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') return null;

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
    console.error('Decryption failed:', err.message);
    return null;
  }
}
