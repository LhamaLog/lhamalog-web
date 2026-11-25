// Refusal of a product name already in use (spec 010, LLT-177; Core specs/006-nome-unico-produto). Pure functions.

// Fixed message of the Core contract. The Core sends no code for this refusal, so the Web compares the message
// (clarify W1). Pending for the Core: send code "product_name_in_use".
export const nameInUseMessage = 'Já existe um produto com este nome nesta empresa. Ele pode estar arquivado.'

// Shown at the top of the form, with the Core message under the name field (clarify N1).
export const nameInUseNotice = 'Nada foi salvo: confira o nome do produto.'

// Reads the error by its shape (status, serverMessage), like endsSession, so it does not depend on the HTTP client.
export function isNameInUse(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error) || error.status !== 409) return false
  const serverMessage = 'serverMessage' in error && typeof error.serverMessage === 'string' ? error.serverMessage.trim() : ''
  return serverMessage === nameInUseMessage
}

export function nameInUseErrors(error: unknown): Record<string, string> {
  return isNameInUse(error) ? { name: nameInUseMessage } : {}
}
