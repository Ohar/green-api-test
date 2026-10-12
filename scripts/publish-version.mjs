import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const tag = `v${version}`
const branch = git('branch', '--show-current')

if (branch !== 'master') {
  throw new Error('Publish releases from master with npm version.')
}

if (git('status', '--porcelain')) {
  throw new Error('Commit all changes before publishing a version.')
}

if (git('rev-parse', `${tag}^{commit}`) !== git('rev-parse', 'HEAD')) {
  throw new Error(`Tag ${tag} must point to HEAD.`)
}

git('remote', 'get-url', 'origin')
execFileSync(
  'git',
  ['push', '--atomic', 'origin', 'HEAD:refs/heads/master', `refs/tags/${tag}`],
  { stdio: 'inherit' },
)
