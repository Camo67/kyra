import { exec, ExecException } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const MAX_COMMAND_DURATION = 1000 * 30 // 30 seconds safeguard

export async function POST(request: Request) {
  try {
    const { command, cwd } = await request.json()

    if (!command || typeof command !== 'string' || !command.trim()) {
      return Response.json(
        { error: 'Command is required.' },
        { status: 400 }
      )
    }

    const result = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout: MAX_COMMAND_DURATION,
      shell: '/bin/bash',
    })

    return Response.json({
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    })
  } catch (error) {
    if (typeof error === 'object' && error && 'stdout' in error) {
      const execError = error as ExecException & {
        stdout?: string
        stderr?: string
      }

      return Response.json(
        {
          stdout: execError.stdout ?? '',
          stderr: execError.stderr ?? execError.message ?? 'Command failed.',
          error: execError.message,
        },
        { status: 500 }
      )
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Command failed.',
      },
      { status: 500 }
    )
  }
}
