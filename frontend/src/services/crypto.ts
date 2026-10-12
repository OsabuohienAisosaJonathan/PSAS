/**
 * Client-Side Cryptographic Hashing using native browser Web Crypto API.
 * Ensures the candidate password NEVER leaves the user's browser in plaintext.
 */
export async function sha256Hex(plainText: string): Promise<string> {
  if (!plainText) return '';
  const msgUint8 = new TextEncoder().encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
