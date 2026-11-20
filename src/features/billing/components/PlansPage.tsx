import { useAuth, useOrganization } from '@clerk/react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../../shared/services/useApi'
import { ApiError } from '../../../shared/services/api'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Input } from '../../../shared/ui/Input'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { isOrganizationAdmin } from '../../team/invitations'
import {
  NO_ORDER_CODE, ORDER_POLL_MS, checkoutPath, checkoutPayload, companyNameError, formatMonthlyPrice, isHttpUrl, orderPath,
  planLabel, planScreenState, plansPath, readCheckout, readOrder, readPlans, shouldPollOrder,
} from '../model'
import type { Order, Plan } from '../model'

// Tela provisória de planos (spec 007): lista os planos do Core, contrata e leva ao pagamento do gateway
// (hoje, o simulador do Asaas no perfil local do Core). O design definitivo segue o Figma em feature própria.
export function PlansPage() {
  const { orgId } = useAuth()
  if (!orgId) return null
  return <PlansScreen key={orgId} />
}

function PlansScreen() {
  const request = useApi()
  const navigate = useNavigate()
  const { orgRole } = useAuth()
  const { organization } = useOrganization()
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [orderNotice, setOrderNotice] = useState('')
  const [reload, setReload] = useState(0)
  const [companyName, setCompanyName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [nameError, setNameError] = useState('')
  const [buying, setBuying] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')

  // O nome começa com o da organização ativa, até a pessoa editar o campo.
  useEffect(() => {
    if (!nameTouched && organization?.name) setCompanyName(organization.name)
  }, [organization?.name, nameTouched])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    setOrderNotice('')
    const loadPlans = request<unknown>(plansPath, { signal: controller.signal }).then(value => {
      const parsed = readPlans(value)
      if (!parsed) throw new Error('O servidor retornou planos em um formato inesperado.')
      return parsed
    })
    const loadOrder = request<unknown>(orderPath, { signal: controller.signal }).then(value => {
      const parsed = readOrder(value)
      if (!parsed) throw new Error('O servidor retornou o pedido em um formato inesperado.')
      return parsed
    }).catch(reason => {
      if (reason instanceof ApiError && reason.status === 404 && reason.code === NO_ORDER_CODE) return null
      throw reason
    })
    Promise.allSettled([loadPlans, loadOrder]).then(([plansResult, orderResult]) => {
      if (controller.signal.aborted) return
      if (plansResult.status === 'fulfilled') setPlans(plansResult.value)
      else if (!endsSession(plansResult.reason)) setLoadError(plansResult.reason?.message ?? 'Não foi possível carregar os planos.')
      if (orderResult.status === 'fulfilled') setOrder(orderResult.value)
      else if (!endsSession(orderResult.reason)) setOrderNotice('Não foi possível consultar a situação da contratação.')
      setLoading(false)
    })
    return () => controller.abort()
  }, [request, reload])

  // Pedido pendente: a confirmação chega pelo webhook, às vezes depois de a pessoa voltar do pagamento.
  // Consulta o pedido de novo até o acesso ser liberado; falhas pontuais só esperam a próxima rodada.
  const polling = shouldPollOrder(order)
  useEffect(() => {
    if (!polling) return
    const controller = new AbortController()
    const timer = window.setInterval(() => {
      request<unknown>(orderPath, { signal: controller.signal }).then(value => {
        const parsed = readOrder(value)
        if (parsed && !controller.signal.aborted) setOrder(parsed)
      }).catch(() => undefined)
    }, ORDER_POLL_MS)
    return () => {
      window.clearInterval(timer)
      controller.abort()
    }
  }, [polling, request])

  if (loading) return <LoadingState label="Carregando planos..." />
  if (loadError || !plans) return <ErrorState description={loadError} onRetry={() => setReload(value => value + 1)} />

  const state = planScreenState(order, isOrganizationAdmin(orgRole))

  async function purchase(plan: Plan, event?: FormEvent) {
    event?.preventDefault()
    setSubmitError('')
    const error = companyNameError(companyName)
    setNameError(error)
    if (error || !state.canPurchase || buying) return
    setBuying(plan.plan)
    try {
      const result = readCheckout(await request<unknown>(checkoutPath, {
        method: 'POST',
        body: JSON.stringify(checkoutPayload(plan.plan, companyName)),
      }))
      if (!result) {
        setSubmitError('O servidor não devolveu um endereço de pagamento válido.')
        setBuying(null)
        return
      }
      window.location.assign(result.paymentUrl)
    } catch (reason) {
      setBuying(null)
      if (endsSession(reason)) return
      if (reason instanceof ApiError && reason.fieldErrors.companyName) setNameError(reason.fieldErrors.companyName)
      else setSubmitError(reason instanceof Error ? reason.message : 'Não foi possível iniciar a contratação.')
    }
  }

  return <section className="space-y-6">
    <PageHeader title="Plano" description="Escolha o plano da sua empresa para liberar o acesso ao LhamaLog." />

    <Card className="border-blue-200 bg-blue-50 text-sm text-[#083B7A]">
      Enquanto a cobrança real não existe, o pagamento abre o simulador local do Asaas. Nenhum valor é cobrado.
    </Card>

    <Card role="status" className="flex flex-wrap items-center justify-between gap-3">
      {state.situation === 'active' && order
        ? <>
          <p className="font-semibold text-[#083B7A]">Plano {planLabel(plans, order.plan)} ativo.</p>
          <Button size="small" fullWidth={false} onClick={() => navigate('/empresa')}>Ir para a empresa</Button>
        </>
        : state.situation === 'pending' && order
        ? <>
          <p className="text-slate-700">Pagamento pendente do plano <strong>{planLabel(plans, order.plan)}</strong>.</p>
          {order.paymentUrl && isHttpUrl(order.paymentUrl) &&
            <a href={order.paymentUrl} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0C70F2] hover:bg-blue-50">Continuar pagamento</a>}
        </>
        : <p className="text-slate-700">Sua empresa ainda não tem um plano ativo. Contrate um plano para liberar o acesso.</p>}
    </Card>
    {orderNotice && <p className="text-sm text-amber-700">{orderNotice}</p>}

    {state.situation !== 'active' && <>
      {state.purchaseDisabledReason && <p className="text-sm font-semibold text-slate-700">{state.purchaseDisabledReason}</p>}
      <div className="max-w-md">
        <Input id="billing-company-name" label="Nome da empresa" value={companyName} maxLength={200}
          error={nameError} disabled={!state.canPurchase}
          onChange={event => { setNameTouched(true); setCompanyName(event.target.value); setNameError('') }} />
      </div>
      {plans.length === 0
        ? <p className="text-slate-600">Nenhum plano disponível no momento.</p>
        : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map(plan => <li key={plan.plan}>
            <Card className="flex h-full flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#083B7A]">{plan.name}</h2>
                <p className="mt-1 text-lg text-slate-700">{formatMonthlyPrice(plan)}</p>
              </div>
              <Button className="mt-auto" disabled={!state.canPurchase || buying !== null}
                onClick={() => purchase(plan)} aria-label={`Contratar o plano ${plan.name}`}>
                {buying === plan.plan ? 'Abrindo o pagamento...' : 'Contratar'}
              </Button>
            </Card>
          </li>)}
        </ul>}
      {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
    </>}
  </section>
}
