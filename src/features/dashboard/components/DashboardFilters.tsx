import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Select } from '../../../shared/ui/Select'
import { dashboardMessage, type DashboardMessageKey } from '../messages'
import type { AccessibleProduct, DashboardFilter, PeriodPreset, Severity } from '../model/types'
import type { AppliedLanguage } from '../../profile/types'

type DashboardFiltersProps = {
  mode: 'product' | 'company'
  language: AppliedLanguage
  draft: DashboardFilter
  products: AccessibleProduct[]
  invalidMessage?: string
  onChange: (next: DashboardFilter) => void
  onApply: () => void
  onRefresh: () => void
  onClearProducts?: () => void
}

const presets: PeriodPreset[] = ['24h', '7d', '30d', 'personalizado']

function toLocalInput(value: Date | null): string {
  if (!value) return ''
  const iso = new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString()
  return iso.slice(0, 16)
}

export function DashboardFilters({
  mode,
  language,
  draft,
  products,
  invalidMessage,
  onChange,
  onApply,
  onRefresh,
  onClearProducts,
}: DashboardFiltersProps) {
  const t = (key: DashboardMessageKey, values?: Record<string, string>) => dashboardMessage(language, key, values)
  const typeValue = draft.severities.length === 0 || draft.severities.length === 3
    ? 'ALL'
    : draft.severities.join(',')

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {mode === 'product' ? (
          <Select
            id="dashboard-product"
            label={t('dashboard.filter.product')}
            value={draft.productIds[0] ?? ''}
            onChange={(event) => onChange({ ...draft, productIds: event.target.value ? [event.target.value] : [] })}
          >
            <option value="">{t('dashboard.filter.product')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </Select>
        ) : (
          <Select
            id="dashboard-products"
            label={t('dashboard.filter.products')}
            value={draft.productIds[0] ?? ''}
            onChange={(event) => {
              const value = event.target.value
              onChange({ ...draft, productIds: value ? [value] : [] })
            }}
          >
            <option value="">{t('dashboard.filter.allProducts')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </Select>
        )}

        <Select
          id="dashboard-period"
          label={t('dashboard.filter.period')}
          value={draft.periodPreset}
          onChange={(event) => onChange({ ...draft, periodPreset: event.target.value as PeriodPreset })}
        >
          {presets.map((preset) => (
            <option key={preset} value={preset}>
              {t(
                preset === '24h'
                  ? 'dashboard.filter.preset.24h'
                  : preset === '7d'
                    ? 'dashboard.filter.preset.7d'
                    : preset === '30d'
                      ? 'dashboard.filter.preset.30d'
                      : 'dashboard.filter.preset.custom',
              )}
            </option>
          ))}
        </Select>

        <Select
          id="dashboard-type"
          label={t('dashboard.filter.type')}
          value={typeValue}
          onChange={(event) => {
            const value = event.target.value
            onChange({
              ...draft,
              severities: value === 'ALL' ? [] : value.split(',') as Severity[],
            })
          }}
        >
          <option value="ALL">{t('dashboard.filter.typeAll')}</option>
          <option value="ERROR">ERROR</option>
          <option value="WARNING">WARNING</option>
          <option value="INFO">INFO</option>
          <option value="ERROR,WARNING">ERROR + WARNING</option>
        </Select>
      </div>

      {draft.periodPreset === 'personalizado' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            id="dashboard-from"
            label={t('dashboard.filter.from')}
            type="datetime-local"
            value={toLocalInput(draft.from)}
            onChange={(event) => onChange({
              ...draft,
              from: event.target.value ? new Date(event.target.value) : null,
            })}
          />
          <Input
            id="dashboard-to"
            label={t('dashboard.filter.to')}
            type="datetime-local"
            value={toLocalInput(draft.to)}
            onChange={(event) => onChange({
              ...draft,
              to: event.target.value ? new Date(event.target.value) : null,
            })}
          />
        </div>
      )}

      {invalidMessage && (
        <p role="alert" className="text-sm text-red-600">{invalidMessage}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="small" fullWidth={false} onClick={onApply}>
          {t('dashboard.filter.apply')}
        </Button>
        <Button type="button" size="small" variant="outline" fullWidth={false} onClick={onRefresh}>
          {t('dashboard.filter.refresh')}
        </Button>
        {mode === 'company' && onClearProducts && (
          <Button type="button" size="small" variant="soft" fullWidth={false} onClick={onClearProducts}>
            {t('dashboard.filter.clear')}
          </Button>
        )}
      </div>
    </section>
  )
}
