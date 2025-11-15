import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

const secret = process.env.ENCRYPTION_SECRET

function resolveKey() {
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is not set')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(value: string | null | undefined) {
  if (!value) return null
  const key = resolveKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decrypt(value: string | null | undefined) {
  if (!value) return null
  const key = resolveKey()
  const buffer = Buffer.from(value, 'base64')
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16)
  const data = buffer.subarray(IV_LENGTH + 16)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}
