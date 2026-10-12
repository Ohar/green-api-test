import { execFileSync } from 'node:child_process'
import { chmodSync } from 'node:fs'

if (!process.env.CI) {
  try {
    const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    const current = execFileSync(
      'git',
      ['config', '--get', 'core.hooksPath'],
      options,
    ).trim()

    if (current && current !== '.githooks') {
      console.warn('Existing Git hooks kept. Use .githooks/pre-push manually.')
      process.exit(0)
    }
  } catch {
    // A missing core.hooksPath is the normal first-install state.
  }

  try {
    execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'])
    chmodSync('.githooks/pre-push', 0o755)
  } catch {
    console.warn('Git hooks unavailable outside a Git checkout.')
  }
}
