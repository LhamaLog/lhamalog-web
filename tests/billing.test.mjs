import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'
register(new URL('./resolve-ts.mjs', import.meta.url))
const model = await import('../src/features/billing/model.ts')
const redirect = await import('../src/shared/services/subscriptionRedirect.ts')
const session = await import('../src/shared/services/sessionRedirect.ts')

const starter = { plan: 'STARTER', name: 'Starter', price: 49.9, currency: 'BRL' }

test('plans parser accepts the Core list and rejects malformed responses', () => {
  assert.deepEqual(model.readPlans([{ ...starter, extra: true }]), [starter])
  assert.deepEqual(model.readPlans([]), [])
  for (const invalid of [null, {}, [null], [{ ...starter, price: -1 }], [{ ...starter, price: '49.9' }],
    [{ ...starter, name: '' }], [starter, starter], [{ ...starter, price: Number.NaN }]])
    assert.equal(model.readPlans(invalid), null)
})

test('order parser reads the latest order and rejects unknown status', () => {
  const order = { orderId: 'o1', plan: 'STARTER', status: 'PENDING', paymentUrl: 'http://localhost:8080/dev/x', subscriptionActive: false }
  assert.deepEqual(model.readOrder(order), order)
  assert.equal(model.readOrder({ ...order, paymentUrl: undefined }).paymentUrl, null)
  assert.equal(model.readOrder({ ...order, status: 'ACTIVE' }), null)
  assert.equal(model.readOrder({ ...order, subscriptionActive: 'true' }), null)
  assert.equal(model.readOrder(null), null)
})

test('checkout only accepts http(s) payment pages', () => {
  const checkout = { orderId: 'o1', plan: 'STARTER', status: 'PENDING', paymentUrl: 'https://sandbox.asaas.com/i/123' }
  assert.deepEqual(model.readCheckout(checkout), checkout)
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '/relative', '', null])
    assert.equal(model.readCheckout({ ...checkout, paymentUrl: url }), null)
  assert.equal(model.isHttpUrl('http://localhost:8080/dev/fake-asaas/checkouts/pay_fake_1'), true)
})

test('company name follows the Core limits and is trimmed in the payload', () => {
  assert.notEqual(model.companyNameError(''), '')
  assert.notEqual(model.companyNameError(' x '), '')
  assert.notEqual(model.companyNameError('a'.repeat(121)), '')
  assert.equal(model.companyNameError('  Empresa Teste  '), '')
  assert.deepEqual(model.checkoutPayload('PRO', '  Empresa Teste  '), { plan: 'PRO', companyName: 'Empresa Teste' })
})

test('monthly price is shown in reais', () => {
  assert.match(model.formatMonthlyPrice(starter), /^R\$\s?49,90\/mês$/)
  assert.match(model.formatMonthlyPrice({ ...starter, price: 0 }), /^R\$\s?0,00\/mês$/)
})

test('screen state: active hides purchase, pending keeps it, members cannot buy', () => {
  const pending = { orderId: 'o', plan: 'PRO', status: 'PENDING', paymentUrl: 'http://x', subscriptionActive: false }
  assert.deepEqual(model.planScreenState({ ...pending, status: 'PAID', subscriptionActive: true }, true),
    { situation: 'active', canPurchase: false, purchaseDisabledReason: '' })
  assert.equal(model.planScreenState(pending, true).situation, 'pending')
  assert.equal(model.planScreenState(pending, true).canPurchase, true)
  assert.equal(model.planScreenState({ ...pending, status: 'CANCELED' }, true).situation, 'none')
  assert.equal(model.planScreenState(null, true).situation, 'none')
  const member = model.planScreenState(null, false)
  assert.equal(member.canPurchase, false)
  assert.notEqual(member.purchaseDisabledReason, '')
})

test('subscription_required notifies listeners and stays a business refusal (no sign-out)', () => {
  let calls = 0
  const stop = redirect.onSubscriptionRequired(() => { calls += 1 })
  redirect.notifySubscriptionRequired()
  stop()
  redirect.notifySubscriptionRequired()
  assert.equal(calls, 1)
  assert.equal(redirect.isSubscriptionRequired({ code: 'subscription_required' }), true)
  assert.equal(redirect.isSubscriptionRequired({ code: 'not_admin' }), false)
  assert.equal(redirect.isSubscriptionRequired(null), false)
  assert.equal(session.classifyRejection(403, 'subscription_required', 'Sua empresa ainda não tem um plano ativo.'), 'keep')
})
