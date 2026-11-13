// Tiles screenshots into one contact sheet for review.
//   node scripts/sheet.mjs <out.jpg> <columns> <tile-width> <file...>
import sharp from 'sharp'

const [out, colsArg, widthArg, ...files] = process.argv.slice(2)
const cols = Number(colsArg), tw = Number(widthArg)
const tiles = await Promise.all(files.map((f) => sharp(f).resize(tw).toBuffer({ resolveWithObject: true })))
const th = Math.max(...tiles.map((t) => t.info.height))
await sharp({ create: { width: cols * tw, height: Math.ceil(tiles.length / cols) * th, channels: 3, background: '#888' } })
  .composite(tiles.map((t, i) => ({ input: t.data, left: (i % cols) * tw, top: Math.floor(i / cols) * th })))
  .jpeg({ quality: 80 })
  .toFile(out)
