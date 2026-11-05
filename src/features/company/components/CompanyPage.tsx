import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useApi } from '../../../shared/services/useApi'
import { ApiError } from '../../../shared/services/api'
import { useApiResource } from '../../../shared/hooks/useApiResource'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { cloneCompanyProfile, loadCompanyProfile, saveCompanyProfile } from '../profile'
import type { Company, CompanyProfileDraft, CompanyTab } from '../types'
import { companyFieldErrors, tabForCompanyField } from '../validation'
import { CompanySettingsForm } from './CompanySettingsForm'

export function CompanyPage() {
  const resource = useApiResource<Company>('/api/company')
  if (resource.loading) return <LoadingState label="Carregando empresa..." />
  if (resource.error || !resource.data) return <ErrorState description={resource.error} onRetry={resource.reload} />
  return <CompanyForm initial={resource.data} reload={resource.reload} />
}

function cloneCompany(company: Company): Company {
  return { ...company, data: { ...company.data }, context: { ...company.context }, address: { ...company.address } }
}

function CompanyForm({ initial, reload }: { initial: Company; reload: () => void }) {
  const storedProfile = useRef(loadCompanyProfile(initial.id))
  const [company, setCompany] = useState(initial)
  const [profile, setProfile] = useState<CompanyProfileDraft>(storedProfile.current)
  const [tab, setTab] = useState<CompanyTab>('data')
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const baseline = useRef({ company: cloneCompany(initial), profile: cloneCompanyProfile(storedProfile.current) })
  const pending = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const request = useApi()

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    saveCompanyProfile(company.id, profile)
  }, [company.id, profile])
  useEffect(() => () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl)
  }, [logoUrl])

  function editCompany(next: Company) {
    setCompany(next)
    setMessage('')
    setError(null)
  }

  function editProfile(next: CompanyProfileDraft) {
    setProfile(next)
    setMessage('')
  }

  function cancel() {
    setCompany(cloneCompany(baseline.current.company))
    setProfile(cloneCompanyProfile(baseline.current.profile))
    setLogoUrl('')
    setMessage('')
    setError(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const localErrors = companyFieldErrors(company)
    if (Object.keys(localErrors).length > 0) {
      setMessage('')
      setError(new ApiError('Confira os campos destacados.', 400, localErrors))
      setTab(tabForCompanyField(Object.keys(localErrors)[0]))
      return
    }
    if (pending.current) return
    pending.current = true
    controller.current = new AbortController()
    const profileSnapshot = cloneCompanyProfile(profile)
    setSaving(true)
    setError(null)
    setMessage('')
    try {
      const saved = await request<Company>('/api/company', {
        method: 'PUT',
        signal: controller.current.signal,
        body: JSON.stringify({ data: company.data, context: company.context, address: company.address, version: company.version }),
      })
      if (!controller.current.signal.aborted) {
        setCompany(saved)
        baseline.current = { company: cloneCompany(saved), profile: profileSnapshot }
        setMessage('Alterações salvas.')
      }
    } catch (reason) {
      if (!controller.current.signal.aborted) setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível salvar.', 0))
    } finally {
      pending.current = false
      if (!controller.current.signal.aborted) setSaving(false)
    }
  }

  return (
    <CompanySettingsForm
      company={company}
      profile={profile}
      tab={tab}
      saving={saving}
      message={message}
      error={error}
      logoUrl={logoUrl}
      onTabChange={setTab}
      onCompanyChange={editCompany}
      onProfileChange={editProfile}
      onLogoChange={(file) => {
        if (!file) return
        setLogoUrl(URL.createObjectURL(file))
        editProfile({ ...profile, logoFileName: file.name })
      }}
      onSubmit={submit}
      onCancel={cancel}
      onReload={reload}
    />
  )
}
