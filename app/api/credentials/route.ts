import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { credentials: true },
  })

  if (!user?.credentials) {
    return NextResponse.json({})
  }

  return NextResponse.json({
    geminiApiKey: decrypt(user.credentials.geminiApiKey),
    huggingfaceApiKey: decrypt(user.credentials.huggingfaceApiKey),
    groqApiKey: decrypt(user.credentials.groqApiKey),
    notionToken: decrypt(user.credentials.notionToken),
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { geminiApiKey, huggingfaceApiKey, groqApiKey, notionToken } =
    await request.json()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

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
      notionToken: encrypt(notionToken),
    },
    update: {
      geminiApiKey: encrypt(geminiApiKey),
      huggingfaceApiKey: encrypt(huggingfaceApiKey),
      groqApiKey: encrypt(groqApiKey),
      notionToken: encrypt(notionToken),
    },
  })

  return NextResponse.json({ success: true })
}
