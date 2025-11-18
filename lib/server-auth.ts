import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { AUTH_DISABLED, FALLBACK_USER_EMAIL, FALLBACK_USER_NAME } from './auth-config'

const includeCredentialsSelect = { credentials: true } as const
type UserWithCreds = Prisma.UserGetPayload<{ include: typeof includeCredentialsSelect }>
type BasicUser = Prisma.UserGetPayload<{}>

export function getActiveUser(includeCredentials: true): Promise<UserWithCreds | null>
export function getActiveUser(includeCredentials?: false): Promise<BasicUser | null>
export async function getActiveUser(includeCredentials = false) {
  if (AUTH_DISABLED) {
    return prisma.user.upsert({
      where: { email: FALLBACK_USER_EMAIL },
      update: {},
      create: {
        email: FALLBACK_USER_EMAIL,
        name: FALLBACK_USER_NAME,
      },
      include: includeCredentials ? includeCredentialsSelect : undefined,
    })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return null
  }

  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: includeCredentials ? includeCredentialsSelect : undefined,
  })
}

export type ActiveUser = UserWithCreds | Prisma.UserGetPayload<{}>
