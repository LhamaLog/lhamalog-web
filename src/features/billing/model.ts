// Tela de planos (spec 007): leitura das respostas de /api/billing do Core (spec 010 do lhamalog-core),
// validação do nome da empresa e estado da tela. Sem React, para os testes com node --test.

export type Plan = { plan: string; name: string; price: number; currency: string }
export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELED'
export type Order = { orderId: string; plan: string; status: OrderStatus; paymentUrl: string | null; subscriptionActive: boolean }
export type Checkout = { orderId: string; plan: string; status: OrderStatus; paymentUrl: string }

export const plansPath = '/api/billing/plans'
export const orderPath = '/api/billing/order'
export const checkoutPath = '/api/billing/checkout'
export const NO_ORDER_CODE = 'no_order'
export const COMPANY_NAME_MIN = 2
export const COMPANY_NAME_MAX = 120
// Com o pedido pendente, a tela consulta o Core de novo até a confirmação do gateway chegar pelo webhook.
export const ORDER_POLL_MS = 5000

const STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'CANCELED']

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}
function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
function status(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (STATUSES as string[]).includes(value)
}

export function readPlans(value: unknown): Plan[] | null {
  if (!Array.isArray(value)) return null
  const plans: Plan[] = []
  for (const item of value) {
    const data = record(item)
    if (!data || !text(data.plan) || !text(data.name) || typeof data.price !== 'number' || !Number.isFinite(data.price)
        || data.price < 0 || !text(data.currency)) return null
    plans.push({ plan: data.plan, name: data.name, price: data.price, currency: data.currency })
  }
  if (new Set(plans.map(item => item.plan)).size !== plans.length) return null
  return plans
}

export function readOrder(value: unknown): Order | null {
  const data = record(value)
  if (!data || !text(data.orderId) || !text(data.plan) || !status(data.status) || typeof data.subscriptionActive !== 'boolean'
      || !(data.paymentUrl === undefined || data.paymentUrl === null || typeof data.paymentUrl === 'string')) return null
  return { orderId: data.orderId, plan: data.plan, status: data.status, paymentUrl: (data.paymentUrl as string | null | undefined) ?? null, subscriptionActive: data.subscriptionActive }
}

export function readCheckout(value: unknown): Checkout | null {
  const data = record(value)
  if (!data || !text(data.orderId) || !text(data.plan) || !status(data.status) || !isHttpUrl(data.paymentUrl)) return null
  return { orderId: data.orderId, plan: data.plan, status: data.status, paymentUrl: data.paymentUrl as string }
}

// Só http e https: o endereço de pagamento vem de uma resposta e nunca pode virar javascript: ou outro esquema.
export function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function companyNameError(value: string): string {
  const name = value.trim()
  if (name.length < COMPANY_NAME_MIN || name.length > COMPANY_NAME_MAX) return 'Informe o nome da empresa, com 2 a 120 caracteres.'
  return ''
}

export function checkoutPayload(plan: string, companyName: string): { plan: string; companyName: string } {
  return { plan, companyName: companyName.trim() }
}

export function formatMonthlyPrice(plan: Plan): string {
  try {
    return `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: plan.currency }).format(plan.price)}/mês`
  } catch {
    return `${plan.price.toFixed(2)} ${plan.currency}/mês`
  }
}

export type PlanScreenState = {
  situation: 'active' | 'pending' | 'none'
  canPurchase: boolean
  purchaseDisabledReason: string
}

export function planScreenState(order: Order | null, isAdmin: boolean): PlanScreenState {
  if (order?.subscriptionActive) return { situation: 'active', canPurchase: false, purchaseDisabledReason: '' }
  const situation = order?.status === 'PENDING' ? 'pending' : 'none'
  return isAdmin
    ? { situation, canPurchase: true, purchaseDisabledReason: '' }
    : { situation, canPurchase: false, purchaseDisabledReason: 'Somente o administrador da empresa pode contratar um plano.' }
}

// Só vale esperar a confirmação de um pedido pendente que ainda não liberou o acesso.
export function shouldPollOrder(order: Order | null): boolean {
  return order !== null && order.status === 'PENDING' && !order.subscriptionActive
}

export function planLabel(plans: Plan[], code: string): string {
  return plans.find(item => item.plan === code)?.name ?? code
}
