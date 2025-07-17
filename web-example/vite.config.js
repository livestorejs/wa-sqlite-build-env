import { defineConfig } from 'vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Plugin to copy WASM files from node_modules to public directory
function copyWasmPlugin() {
  return {
    name: 'copy-wasm',
    buildStart() {
      // Copy WASM files to public directory
      const publicDir = resolve(process.cwd(), 'public')
      
      // Copy wa-sqlite WASM
      const waSqliteWasm = resolve(process.cwd(), 'node_modules/wa-sqlite/dist/wa-sqlite.wasm')
      const waSqliteTarget = resolve(publicDir, 'wa-sqlite.wasm')
      if (existsSync(waSqliteWasm)) {
        copyFileSync(waSqliteWasm, waSqliteTarget)
        console.log('✓ Copied wa-sqlite.wasm to public/')
      }
      
      // Copy sqldiff WASM (from linked package)
      const sqldiffWasm = resolve(process.cwd(), '../sqldiff-wasm-package/dist/sqldiff.wasm')
      const sqldiffTarget = resolve(publicDir, 'sqldiff.wasm')
      if (existsSync(sqldiffWasm)) {
        copyFileSync(sqldiffWasm, sqldiffTarget)
        console.log('✓ Copied sqldiff.wasm to public/')
      }
    }
  }
}

export default defineConfig({
  plugins: [copyWasmPlugin()],
  server: {
    fs: {
      // Allow serving files from the parent directory
      allow: ['..']
    }
  },
  optimizeDeps: {
    // Exclude packages that have WASM files from pre-bundling
    exclude: ['@schickling/sqldiff-wasm', 'wa-sqlite']
  },
  assetsInclude: ['**/*.wasm']
}) 