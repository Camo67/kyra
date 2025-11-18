#!/usr/bin/env node

/**
 * Ensures that the SQLite file defined in DATABASE_URL exists before Prisma runs.
 * Prisma resolves relative SQLite paths from the prisma/schema.prisma directory,
 * so we mirror that behavior here.
 */
const fs = require('fs')
const path = require('path')

const loadedKeys = new Set()
const envFiles = ['.env', '.env.local']

for (const file of envFiles) {
  const envPath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(envPath)) continue
  const overrideLoaded = file.endsWith('.local')
  const envText = fs.readFileSync(envPath, 'utf8')
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const eqIndex = line.indexOf('=')
      if (eqIndex === -1) return
      const key = line.slice(0, eqIndex).trim()
      if (!key) return
      let value = line.slice(eqIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      const alreadyLoaded = loadedKeys.has(key)
      if (
        process.env[key] === undefined ||
        (overrideLoaded && alreadyLoaded)
      ) {
        process.env[key] = value
        loadedKeys.add(key)
      }
    })
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl || !dbUrl.startsWith('file:')) {
  process.exit(0)
}

const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma')
const schemaDir = path.dirname(schemaPath)
const [filePart] = dbUrl.replace(/^file:/, '').split('?')
const trimmed = filePart.trim()
if (!trimmed) {
  process.exit(0)
}

const resolveFromSchema = trimmed.startsWith('./') || trimmed.startsWith('../')
const targetPath = resolveFromSchema
  ? path.resolve(schemaDir, trimmed)
  : path.resolve(trimmed)

fs.mkdirSync(path.dirname(targetPath), { recursive: true })

if (!fs.existsSync(targetPath)) {
  fs.writeFileSync(targetPath, '')
  console.log(`[ensure-sqlite] Created ${path.relative(process.cwd(), targetPath)}`)
}
