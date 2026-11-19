// Same limits as the Core (FR-013/FR-014): the Web refuses before calling it (spec 005, US5 scenario 6).

export const nameRequired = 'Informe o nome do cargo, com até 60 caracteres.'

export function nameError(name: string): string | undefined {
  const trimmed = name.trim()
  return trimmed.length < 1 || trimmed.length > 60 ? nameRequired : undefined
}

export function severitiesError(values: readonly string[]): string | undefined {
  return values.length === 0 ? 'Escolha pelo menos uma gravidade.' : undefined
}

export function alertTypesError(values: readonly string[]): string | undefined {
  return values.length === 0 ? 'Escolha pelo menos um tipo.' : undefined
}
