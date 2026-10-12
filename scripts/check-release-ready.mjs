import { execFileSync } from 'node:child_process'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

if (git('branch', '--show-current') !== 'master') {
  throw new Error('Switch to master before running npm version.')
}

if (git('status', '--porcelain')) {
  throw new Error('Commit all changes before running npm version.')
}

git('remote', 'get-url', 'origin')
console.log('Release branch, clean checkout and origin verified.')
