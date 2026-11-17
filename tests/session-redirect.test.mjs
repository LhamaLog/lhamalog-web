import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SIGNED_OUT_REASON,
  classifyRejection,
  endsSession,
  safeReturnPath,
  signInUrl,
  signOutOnce,
} from '../src/shared/services/sessionRedirect.ts'

test('classifies Core rejections: security ends the session, business keeps it', () => {
  const cases = [
    [401, '', '', 'session'],
    [401, 'not_admin', 'Mensagem', 'session'],
    [403, '', '', 'session'],
    [403, 'not_admin', 'Somente o administrador da empresa pode gerenciar os usuários.', 'keep'],
    [403, 'user_deactivated', '', 'keep'],
    [403, 'last_admin', '', 'keep'],
    [403, 'no_organization', '', 'keep'],
    [403, 'codigo_novo', '', 'keep'],
    [403, '', 'Somente o administrador da empresa pode alterar este cadastro.', 'keep'],
    [403, '  ', '  ', 'session'],
    [404, '', '', 'keep'],
    [409, '', '', 'keep'],
    [0, '', '', 'keep'],
    [500, '', '', 'keep'],
  ]
  for (const [status, code, serverMessage, expected] of cases) {
    assert.equal(classifyRejection(status, code, serverMessage), expected, `${status} ${code} ${serverMessage}`)
  }
  assert.equal(classifyRejection(403), 'session')
})

test('recognizes errors that already ended the session', () => {
  assert.equal(endsSession({ status: 401, code: '', serverMessage: '' }), true)
  assert.equal(endsSession({ status: 403 }), true)
  assert.equal(endsSession({ status: 403, code: 'not_admin', serverMessage: '' }), false)
  assert.equal(endsSession({ status: 403, code: '', serverMessage: 'Somente o administrador...' }), false)
  assert.equal(endsSession({ status: 0 }), false)
  assert.equal(endsSession(new Error('falha')), false)
  assert.equal(endsSession(null), false)
  assert.equal(endsSession('401'), false)
})

test('accepts only internal return paths', () => {
  const cases = [
    ['/produtos', '/produtos'],
    ['/produtos?pagina=2', '/produtos?pagina=2'],
    ['/empresa#endereco', '/empresa#endereco'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['/produtos\\x', '/'],
    ['javascript:alert(1)', '/'],
    ['produtos', '/'],
    ['/sign-in', '/'],
    ['/sign-in/factor-two', '/'],
    ['/sign-in?motivo=deslogado', '/'],
    ['/sign-up', '/'],
    ['/tarefas/configurar-mfa', '/'],
    ['/organizacoes/nova', '/'],
    ['/sign-inx', '/sign-inx'],
    ['/produtos\u0000', '/'],
    ['/produtos\u007f', '/'],
    [`/${'a'.repeat(2047)}`, `/${'a'.repeat(2047)}`],
    [`/${'a'.repeat(2048)}`, '/'],
    ['', '/'],
    [null, '/'],
    [undefined, '/'],
  ]
  for (const [value, expected] of cases) {
    assert.equal(safeReturnPath(value), expected, String(value).slice(0, 40))
  }
})

test('turns a same-origin absolute address from the Clerk into an internal path', () => {
  const origin = 'http://localhost:5173'
  assert.equal(safeReturnPath('http://localhost:5173/produtos?pagina=2#lista', origin), '/produtos?pagina=2#lista')
  assert.equal(safeReturnPath('http://localhost:5173/sign-in', origin), '/')
  assert.equal(safeReturnPath('http://localhost:5174/produtos', origin), '/')
  assert.equal(safeReturnPath('https://evil.example/produtos', origin), '/')
  assert.equal(safeReturnPath('http://localhost:5173/produtos'), '/')
  assert.equal(safeReturnPath('/equipe', origin), '/equipe')
})

test('builds the sign-in address with the notice and the encoded return path', () => {
  assert.equal(SIGNED_OUT_REASON, 'deslogado')
  assert.equal(signInUrl('/produtos?pagina=2'), '/sign-in?motivo=deslogado&redirect_url=%2Fprodutos%3Fpagina%3D2')
  assert.equal(signInUrl('/'), '/sign-in?motivo=deslogado')
  assert.equal(signInUrl('https://evil.example'), '/sign-in?motivo=deslogado')
  assert.equal(signInUrl(undefined), '/sign-in?motivo=deslogado')
})

test('signs out once for simultaneous rejections and again after it finishes', async () => {
  const calls = []
  let finish
  const signOut = (options) => {
    calls.push(options.redirectUrl)
    return new Promise((resolve) => { finish = resolve })
  }
  const first = signOutOnce(signOut, '/produtos')
  const second = signOutOnce(signOut, '/empresa')
  const third = signOutOnce(signOut, '/equipe')
  assert.equal(calls.length, 1)
  assert.equal(calls[0], '/sign-in?motivo=deslogado&redirect_url=%2Fprodutos')
  finish()
  await Promise.all([first, second, third])

  const failing = () => { calls.push('failed'); return Promise.reject(new Error('network')) }
  await assert.rejects(signOutOnce(failing, '/'))
  const again = signOutOnce(signOut, '/')
  assert.equal(calls.length, 3)
  assert.equal(calls[2], '/sign-in?motivo=deslogado')
  finish()
  await again
})
