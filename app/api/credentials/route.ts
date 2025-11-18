import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import { getActiveUser } from '@/lib/server-auth'

export async function GET() {
  const user = await getActiveUser(true)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user?.credentials) {
    return NextResponse.json({})
  }

  return NextResponse.json({
    geminiApiKey: decrypt(user.credentials.geminiApiKey),
    huggingfaceApiKey: decrypt(user.credentials.huggingfaceApiKey),
    groqApiKey: decrypt(user.credentials.groqApiKey),
    openaiApiKey: decrypt(user.credentials.openaiApiKey),
    anthropicApiKey: decrypt(user.credentials.anthropicApiKey),
    perplexityApiKey: decrypt(user.credentials.perplexityApiKey),
    notionToken: decrypt(user.credentials.notionToken),
  })
}

export async function POST(request: Request) {
  const {
    geminiApiKey,
    huggingfaceApiKey,
    groqApiKey,
    openaiApiKey,
    anthropicApiKey,
    perplexityApiKey,
    notionToken,
  } = await request.json()

  const user = await getActiveUser()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.userCredential.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      geminiApiKey: encrypt(geminiApiKey),
      huggingfaceApiKey: encrypt(huggingfaceApiKey),
      groqApiKey: encrypt(groqApiKey),
      openaiApiKey: encrypt(openaiApiKey),
      anthropicApiKey: encrypt(anthropicApiKey),
      perplexityApiKey: encrypt(perplexityApiKey),
      notionToken: encrypt(notionToken),
    },
    update: {
      geminiApiKey: encrypt(geminiApiKey),
      huggingfaceApiKey: encrypt(huggingfaceApiKey),
      groqApiKey: encrypt(groqApiKey),
      openaiApiKey: encrypt(openaiApiKey),
      anthropicApiKey: encrypt(anthropicApiKey),
      perplexityApiKey: encrypt(perplexityApiKey),
      notionToken: encrypt(notionToken),
    },
  })

  return NextResponse.json({ success: true })
}
