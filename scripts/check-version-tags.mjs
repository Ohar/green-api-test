import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const updates = readFileSync(0, 'utf8').trim().split('\n').filter(Boolean)
const versionPattern = /^v\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/

for (const update of updates) {
  const [localRef, localSha, remoteRef] = update.split(/\s+/)
  const tag = remoteRef.replace('refs/tags/', '')

  if (!remoteRef.startsWith('refs/tags/v') || /^0+$/.test(localSha)) {
    continue
  }

  if (!versionPattern.test(tag)) {
    throw new Error(`Release tag must be a semantic version: ${tag}`)
  }

  const packageJson = execFileSync(
    'git',
    ['show', `${localSha}^{commit}:package.json`],
    { encoding: 'utf8' },
  )
  const { version } = JSON.parse(packageJson)

  if (tag !== `v${version}`) {
    throw new Error(`${localRef}: tag ${tag} differs from version ${version}`)
  }
}
