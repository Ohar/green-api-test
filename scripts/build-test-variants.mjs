import { spawnSync } from 'node:child_process'

for (const mode of ['whatsapp', 'telegram', 'both']) {
  const result = spawnSync(process.execPath, [
    'node_modules/vite/bin/vite.js', 'build',
    '--outDir', `.preview-builds/${mode}`,
  ], {
    stdio: 'inherit',
    env: { ...process.env, VITE_MESSENGER_MODE: mode },
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
