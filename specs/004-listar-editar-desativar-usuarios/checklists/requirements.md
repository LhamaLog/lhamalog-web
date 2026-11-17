# Specification Quality Checklist: Listar, editar e desativar usuários

**Purpose**: Validar completude e qualidade da especificação antes do planejamento
**Created**: 2026-11-15
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Sem detalhes de implementação (linguagens, frameworks, APIs)
- [x] Focada em valor para o usuário e necessidade de negócio
- [x] Escrita para partes interessadas não técnicas
- [x] Todas as seções obrigatórias preenchidas

## Requirement Completeness

- [x] Não restam marcadores [NEEDS CLARIFICATION]
- [x] Requisitos são testáveis e não ambíguos
- [x] Critérios de sucesso são mensuráveis
- [x] Critérios de sucesso são agnósticos de tecnologia (sem detalhes de implementação)
- [x] Todos os cenários de aceite estão definidos
- [x] Casos de borda estão identificados
- [x] O escopo está claramente delimitado
- [x] Dependências e premissas estão identificadas

## Feature Readiness

- [x] Todos os requisitos funcionais têm critérios de aceite claros
- [x] Os cenários de usuário cobrem os fluxos principais
- [x] A funcionalidade atende aos resultados mensuráveis definidos em Critérios de Sucesso
- [x] Detalhes de implementação não vazam para a especificação

## Notes

- Revisão 1 (2026-11-15): três marcadores ficaram de propósito. Os itens de clareza permaneceram desmarcados.
- Revisão 2 (2026-11-15): o responsável fechou corte por marca no serviço, último acesso no serviço, edição só de cargo, rota `/equipe`, trava dupla do último administrador, reativação e lista só para administrador. Os marcadores foram removidos.
- Revisão 3 (2026-11-15): o Web passou a seguir o contrato do Core no commit `4f32c77`: `POST` e `DELETE` sem corpo, 403 com `code`, frases do Core e contagem que ignora administrador `deactivated`.
- Sem `extensions.yml`: nenhum hook de `before_specify`, `after_specify`, `before_clarify` ou `after_clarify`.
- Checklist satisfeito para seguir ao `$speckit-plan`.
