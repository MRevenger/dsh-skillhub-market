/**
 * Build host (ESM) and browser panel (ModuleLoader factory) bundles.
 *
 * The DSH sandbox on Windows does not allow esbuild's native helper process to
 * be spawned (`spawn EPERM`), so the WebAssembly build of esbuild is used
 * instead. Its browser API has no direct file-system access, hence the small
 * read-only virtual-FS plugin below.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

globalThis.self ??= globalThis

const require = createRequire(import.meta.url)
const esbuild = require('esbuild-wasm/lib/browser.js')
const wasmModule = new WebAssembly.Module(
  readFileSync(path.resolve('node_modules/esbuild-wasm/esbuild.wasm')),
)
await esbuild.initialize({ wasmModule, worker: false })

const LOADERS = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.jsx': 'jsx',
  '.mjs': 'js',
  '.json': 'json',
}

function loaderFor(file) {
  return LOADERS[path.extname(file).toLowerCase()] ?? 'js'
}

function toPosix(file) {
  return file.replace(/\\/g, '/')
}

// esbuild-wasm runs with POSIX path semantics, so expose this project under a
// virtual absolute prefix and translate back when reading files.
const PROJECT_ROOT = toPosix(process.cwd())
const VIRTUAL_ROOT = '/project'

function toVirtual(file) {
  const posix = toPosix(path.resolve(file))
  return posix.startsWith(PROJECT_ROOT)
    ? VIRTUAL_ROOT + posix.slice(PROJECT_ROOT.length)
    : posix
}

function toReal(file) {
  return file.startsWith(VIRTUAL_ROOT)
    ? PROJECT_ROOT + file.slice(VIRTUAL_ROOT.length)
    : file
}

function resolveFile(candidate) {
  for (const file of [candidate, ...['.ts', '.tsx', '.js', '.jsx', '.json'].map((ext) => candidate + ext)]) {
    if (existsSync(file)) return toVirtual(file)
  }
  return toVirtual(candidate)
}

/** Read-only file-system adapter for esbuild-wasm's browser build. */
const fileSystemPlugin = {
  name: 'virtual-fs',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.kind === 'entry-point') {
        return { path: resolveFile(path.resolve(args.path)) }
      }
      if (args.path.startsWith('.')) {
        const base = path.dirname(toReal(args.importer))
        return { path: resolveFile(path.resolve(base, args.path)) }
      }
      // Package imports such as `react` stay external; the ModuleLoader
      // supplies them from the browser module table.
      return { path: args.path, external: true }
    })

    build.onLoad({ filter: /.*/ }, async (args) => ({
      contents: await readFile(toReal(args.path), 'utf8'),
      loader: loaderFor(args.path),
    }))
  },
}

await mkdir('lib', { recursive: true })

const host = await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  legalComments: 'none',
  logLevel: 'warning',
  plugins: [fileSystemPlugin],
})
await writeFile('lib/index.js', host.outputFiles[0].text, 'utf8')

const client = await esbuild.build({
  entryPoints: ['src/client/index.tsx'],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  globalName: '__skillhubMarket',
  target: 'es2020',
  jsx: 'transform',
  external: ['react'],
  legalComments: 'none',
  logLevel: 'warning',
  plugins: [fileSystemPlugin],
})

const code = client.outputFiles[0]?.text ?? ''
const wrapped = `window.__ModuleLoader__.load({\n  id: '@local/dsh-skillhub-market',\n  factory: function (require) {\n${code}\nreturn __skillhubMarket;\n  },\n});\n`
await writeFile('lib/client.js', wrapped, 'utf8')
