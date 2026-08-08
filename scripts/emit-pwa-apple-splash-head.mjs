#!/usr/bin/env node
/**
 * Écrit `pwa-apple-splash-head.html` (liens apple-touch-startup-image + favicons)
 * à partir de `pwa-assets.config.ts`. Exécuter après `npm run generate-pwa-assets`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from '@vite-pwa/assets-generator/config'
import { generateHtmlMarkup } from '../node_modules/@vite-pwa/assets-generator/dist/api/generate-html-markup.mjs'
import { resolveInstructions } from '../node_modules/@vite-pwa/assets-generator/dist/chunks/instructions-resolver.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const { config } = await loadConfig(ROOT, resolve(ROOT, 'pwa-assets.config.ts'))
const { preset, images: configImages, headLinkOptions: userHeadLinkOptions } = config
if (!configImages?.length) {
  console.error('pwa-assets.config: images manquant')
  process.exit(1)
}
const useImages = Array.isArray(configImages) ? configImages : [configImages]
const xhtml = userHeadLinkOptions?.xhtml === true
const includeId = userHeadLinkOptions?.includeId === true

const lines = []
for (const i of useImages) {
  const instruction = await resolveInstructions({
    imageResolver: () => readFile(resolve(ROOT, i)),
    imageName: resolve(ROOT, i),
    originalName: i,
    preset,
    faviconPreset: userHeadLinkOptions?.preset,
    htmlLinks: { xhtml, includeId },
    basePath: userHeadLinkOptions?.basePath ?? '/',
    resolveSvgName: userHeadLinkOptions?.resolveSvgName ?? ((name) => basename(name)),
  })
  const links = generateHtmlMarkup(instruction)
  for (const link of links) {
    if (Array.isArray(link)) {
      for (const l of link) {
        if (l) lines.push(l)
      }
    } else if (link) {
      lines.push(link)
    }
  }
}

const header =
  '<!-- PWA: généré par scripts/emit-pwa-apple-splash-head.mjs — ne pas éditer à la main -->\n'
const onlySplash = lines.filter((l) => typeof l === 'string' && l.includes('apple-touch-startup-image'))
const out = `${header}${onlySplash.join('\n')}\n`
await writeFile(resolve(ROOT, 'pwa-apple-splash-head.html'), out, 'utf-8')
console.log(`OK: pwa-apple-splash-head.html (${onlySplash.length} splashes, ${lines.length} liens bruts)`)
