import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = '.output/public'
const files = await readdir(root, { recursive: true, withFileTypes: true })
const assets = files.filter(file => file.isFile()).map(file => relative(root, join(file.parentPath, file.name)).replaceAll('\\', '/'))
  .filter(path => !path.endsWith('.map') && !['sw.js', '200.html', '404.html', 'robots.txt', 'sitemap.xml'].includes(path))
  .sort()
for (const route of ['index.html', 'es/index.html']) {
  if (!assets.includes(route)) throw new Error(`Missing prerendered route: ${route}`)
}
const digest = createHash('sha256')
for (const path of assets) digest.update(await readFile(join(root, path)))
const version = digest.digest('hex').slice(0, 16)
const worker = (await readFile('public/sw.js', 'utf8'))
  .replace('const PRECACHE = []', `const PRECACHE = ${JSON.stringify(assets.map(path => `/${path}`))}`)
  .replace('pomotea-static-development', `pomotea-static-${version}`)
await writeFile(join(root, 'sw.js'), worker)
console.log(`Prepared offline app: ${assets.length} assets, version ${version}`)
