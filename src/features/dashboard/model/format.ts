/** 1 GiB = 2^30 bytes */
export const BYTES_PER_GIB = 1073741824

/**
 * Formata volume em GiB (base 2^30) no locale informado, com até 2 casas decimais.
 * Exemplos (pt-BR): 1073741824 → "1 GiB"; 1610612736 → "1,5 GiB"; 0 → "0 GiB".
 */
export function formatVolumeGiB(value: number, locale = 'pt-BR'): string {
  if (!Number.isFinite(value) || value < 0) return '0 GiB'
  const gib = value / BYTES_PER_GIB
  return `${gib.toLocaleString(locale, { maximumFractionDigits: 2 })} GiB`
}

export function formatCount(value: number, locale = 'pt-BR'): string {
  return (Number.isFinite(value) ? value : 0).toLocaleString(locale)
}
