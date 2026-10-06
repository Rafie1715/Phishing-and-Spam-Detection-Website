import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

test('source files contain no unresolved merge markers', async () => {
  const root = new URL('../src/', import.meta.url)
  const entries = await readdir(root, { recursive: true })
  for (const entry of entries.filter(name => /\.(jsx?|css)$/.test(name))) {
    const source = await readFile(new URL(entry.replaceAll('\\', '/'), root), 'utf8')
    assert.equal(/^(?:<{7}|={7}|>{7}|\|{7})(?:\s|$)/m.test(source), false, `Unresolved conflict: ${entry}`)
  }
})
