import { Card } from '../../../shared/ui/Card'
import { Select } from '../../../shared/ui/Select'
import { Textarea } from '../../../shared/ui/Textarea'
import { contextErrorFor, contextLimits, languageOptions, personalityOptions } from '../context'
import type { ContextListField, Personality, ProductContext } from '../types'
import { ChipListField } from './ChipListField'
import { ReorderListField } from './ReorderListField'
import { SegmentedControl } from './SegmentedControl'

// "Contexto para IA" tab as in the Figma frame 03-produto-contexto-ia.png.
export function ProductContextFields({
  context,
  errors,
  onChange,
}: {
  context: ProductContext
  errors: Record<string, string>
  onChange: (context: ProductContext) => void
}) {
  function setList(field: ContextListField, items: string[]) {
    onChange({ ...context, [field]: items })
  }

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-5">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C70F2]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
            <path d="m12 8 1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2Z" />
          </svg>
        </span>
        <span>
          <h3 className="text-lg font-bold text-[#083B7A]">Contexto para IA</h3>
          <p className="text-sm text-slate-500">Descreva o produto para a IA interpretar melhor os logs e as análises.</p>
        </span>
      </div>

      <Textarea
        id="product-functionalDescription"
        label="Descrição funcional"
        requiredMark
        showCount={false}
        maxLength={contextLimits.functionalDescription}
        value={context.functionalDescription}
        hint="Explique o que o produto faz e como ele funciona, para a IA entender o contexto dos logs."
        error={contextErrorFor(errors, 'functionalDescription')}
        onChange={(event) => onChange({ ...context, functionalDescription: event.target.value })}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <SegmentedControl<Personality>
          id="product-personality"
          label="Personalidade"
          requiredMark
          options={personalityOptions}
          value={context.personality}
          hint="Define o nível de detalhe das respostas da IA."
          error={contextErrorFor(errors, 'personality')}
          onChange={(personality) => onChange({ ...context, personality })}
        />
        <Select
          id="product-responseLanguage"
          label="Idioma da resposta"
          value={context.responseLanguage}
          hint="Idioma usado nas análises da IA."
          error={contextErrorFor(errors, 'responseLanguage')}
          startIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-slate-500">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </svg>
          }
          onChange={(event) => onChange({ ...context, responseLanguage: event.target.value })}
        >
          {languageOptions(context.responseLanguage).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </div>

      <ChipListField
        id="product-architecture"
        label="Arquitetura"
        field="architecture"
        items={context.architecture}
        hint="Linguagem, framework, banco de dados e protocolo usados no produto."
        error={contextErrorFor(errors, 'architecture')}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
          </svg>
        }
        onChange={(items) => setList('architecture', items)}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <ReorderListField
          id="product-scope"
          label="Escopo / Lista"
          field="scope"
          items={context.scope}
          hint="Liste o que está dentro do escopo. A IA usa como referência."
          error={contextErrorFor(errors, 'scope')}
          onChange={(items) => setList('scope', items)}
        />
        <ReorderListField
          id="product-sensitiveData"
          label="Dados sensíveis"
          field="sensitiveData"
          items={context.sensitiveData}
          hint="A IA evita expor esses dados nas análises."
          error={contextErrorFor(errors, 'sensitiveData')}
          onChange={(items) => setList('sensitiveData', items)}
        />
      </div>
    </Card>
  )
}
