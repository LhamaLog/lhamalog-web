const blocked = ['script', 'foreignobject', 'iframe', 'embed', 'object', 'audio', 'video', 'animate', 'handler']

export function logoRejection(mediaType: string, bytes: Uint8Array) {
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) return 'Envie um arquivo PNG, JPG ou SVG de até 2 MB.'
  const png = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const text = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 4096))).trim().toLowerCase()
  const svg = text.startsWith('<svg') || text.startsWith('<?xml')
  if (mediaType === 'image/png' && png) return null
  if ((mediaType === 'image/jpeg' || mediaType === 'image/jpg') && jpeg) return null
  if (mediaType === 'image/svg+xml' && svg) return svgRejection(new TextDecoder().decode(bytes))
  return svg ? 'O SVG não pôde ser aceito com segurança.' : 'Envie um arquivo PNG, JPG ou SVG.'
}

function svgRejection(source: string) {
  const text = source.toLowerCase()
  if (text.includes('<!doctype') || text.includes('<script') || text.includes('javascript:') || text.includes('expression(')) {
    return 'O SVG não pôde ser aceito com segurança.'
  }
  for (const name of blocked) {
    if (text.includes(`<${name}`)) return 'O SVG não pôde ser aceito com segurança.'
  }
  if (/\son[a-z0-9:-]+\s*=/.test(text)) return 'O SVG não pôde ser aceito com segurança.'
  if (/href\s*=\s*['"](?!#)/.test(text)) return 'O SVG não pôde ser aceito com segurança.'
  if (/style\s*=\s*['"][^'"]*(?:url\s*\(|@import)/.test(text)) return 'O SVG não pôde ser aceito com segurança.'
  return null
}
