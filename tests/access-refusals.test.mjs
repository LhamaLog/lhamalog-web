import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

// Business refusals of LLT-120, with the status and message the Core sends (Core spec 011, contracts/api.md).
const refusals = [
  { status: 403, code: 'not_admin', message: 'Somente o Dono ou um Administrador pode fazer esta ação.' },
  { status: 403, code: 'owner_protected', message: 'Não é possível desativar o Dono da empresa.' },
  { status: 409, code: 'full_access', message: 'Este membro acessa todos os Produtos.' },
  { status: 404, code: 'product_not_found', message: 'Produto não encontrado nesta empresa.' },
  { status: 409, code: 'immutable_role', message: 'Este cargo é padrão e não pode ser alterado.' },
  { status: 409, code: 'role_name_in_use', message: 'Já existe um cargo com este nome nesta empresa.' },
  { status: 409, code: 'members_from_access_role', message: 'Os membros deste cargo vêm do papel de acesso.' },
  { status: 409, code: 'role_members_limit', message: 'O cargo já tem 200 membros.' },
  { status: 404, code: 'role_not_found', message: 'Cargo não encontrado.' },
]

test('every business refusal of LLT-120 keeps the session (spec 006)', async () => {
  const { classifyRejection, endsSession } = await import('../src/shared/services/sessionRedirect.ts')
  for (const refusal of refusals) {
    assert.equal(classifyRejection(refusal.status, refusal.code, refusal.message), 'keep', refusal.code)
    assert.equal(endsSession({ status: refusal.status, code: refusal.code, serverMessage: refusal.message }), false, refusal.code)
  }
  // Contrast: the security 403 {"error":"forbidden"} has no code and no message, and ends the session.
  assert.equal(classifyRejection(403, '', ''), 'session')
})

test('company without a plan keeps the session and goes to the plans screen, not to an access error', async () => {
  const { classifyRejection } = await import('../src/shared/services/sessionRedirect.ts')
  const { isSubscriptionRequired } = await import('../src/shared/services/subscriptionRedirect.ts')
  const { accessFailureStatus } = await import('../src/features/access/accessContract.ts')
  const refusal = { status: 403, code: 'subscription_required', serverMessage: 'Contrate um plano para continuar.' }
  assert.equal(classifyRejection(refusal.status, refusal.code, refusal.serverMessage), 'keep')
  assert.equal(isSubscriptionRequired(refusal), true)
  assert.equal(accessFailureStatus(refusal), 'unsubscribed')
})

test('the screens show the Core message for each refusal, or their own clearer text', async () => {
  const { roleErrorMessage } = await import('../src/features/notification-roles/roleContract.ts')
  const { productAccessErrorMessage, fullAccessMessage, productNotFoundMessage } = await import('../src/features/team/productAccess.ts')
  const { ownerDeactivateMessage } = await import('../src/features/team/ownerRules.ts')
  const byCode = Object.fromEntries(refusals.map((refusal) => [refusal.code, refusal.message]))

  for (const code of ['immutable_role', 'role_name_in_use', 'role_not_found', 'role_members_limit']) {
    assert.equal(roleErrorMessage(code), byCode[code], code)
  }
  // Same meaning, worded for the person who is choosing people (US6).
  assert.equal(roleErrorMessage('members_from_access_role'), 'As pessoas deste cargo vêm do papel de acesso.')
  // The products panel explains what to do (US4): full access, or reload the list.
  assert.equal(productAccessErrorMessage('full_access'), fullAccessMessage)
  assert.equal(productAccessErrorMessage('product_not_found'), productNotFoundMessage)
  assert.equal(ownerDeactivateMessage, byCode.owner_protected)
  // A code the screen does not know falls back to the Core message (ApiError.message).
  assert.equal(roleErrorMessage('not_admin'), null)
  assert.equal(productAccessErrorMessage('not_admin'), null)
})

test('ApiError carries the Core message and code of a business refusal', async () => {
  const { apiRequest } = await import('../src/shared/services/api.ts')
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ message: byMessage('owner_protected'), code: 'owner_protected' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } })
  try {
    await assert.rejects(apiRequest('http://core.test', '/api/company/members/user_ana/deactivation', 'token', { method: 'POST' }),
      (error) => error.status === 403 && error.code === 'owner_protected' && error.message === byMessage('owner_protected'))
  } finally {
    globalThis.fetch = original
  }
})

function byMessage(code) {
  return refusals.find((refusal) => refusal.code === code).message
}
