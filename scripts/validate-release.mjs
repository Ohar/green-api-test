import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const tag = process.env.GITHUB_REF_NAME
const expected = `v${version}`

if (process.env.GITHUB_REF_TYPE !== 'tag' || tag !== expected) {
  throw new Error(`Release must run on the package version tag ${expected}.`)
}

if (!/^v\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(tag)) {
  throw new Error('A semantic version tag is required.')
}

execFileSync('git', [
  'merge-base', '--is-ancestor', 'HEAD', 'origin/master',
])
console.log(`Verified ${tag} belongs to master.`)
