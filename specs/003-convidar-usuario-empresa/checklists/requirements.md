# Specification Quality Checklist: Convidar usuário para a empresa

**Purpose**: Validar completude e qualidade da especificação antes do planejamento
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Sem detalhes de implementação (linguagens, frameworks, APIs)
- [x] Focada em valor para o usuário e necessidade de negócio
- [x] Escrita para partes interessadas não técnicas
- [x] Todas as seções obrigatórias preenchidas

## Requirement Completeness

- [ ] Não restam marcadores [NEEDS CLARIFICATION]
- [ ] Requisitos são testáveis e não ambíguos
- [x] Critérios de sucesso são mensuráveis
- [x] Critérios de sucesso são agnósticos de tecnologia (sem detalhes de implementação)
- [x] Todos os cenários de aceite estão definidos
- [x] Casos de borda estão identificados
- [x] O escopo está claramente delimitado
- [x] Dependências e premissas estão identificadas

## Feature Readiness

- [ ] Todos os requisitos funcionais têm critérios de aceite claros
- [x] Os cenários de usuário cobrem os fluxos principais
- [x] A funcionalidade atende aos resultados mensuráveis definidos em Critérios de Sucesso
- [x] Detalhes de implementação não vazam para a especificação

## Notes

- Revisão 1 (2026-11-12): a especificação cobre os três critérios de aceite (e-mail com prazo, vínculo à empresa com o cargo escolhido, expirado ou revogado inutilizável). Cinco decisões ficaram abertas de propósito, a pedido do responsável, e não foram respondidas: canal do convite (FR-007), cargos da tela (FR-005), lugar da tela (FR-015), lista com revogar e reenviar (FR-013) e percurso de aceite (FR-016). As recomendações estão na seção Clarifications e não foram aplicadas aos requisitos.
- Os três itens desmarcados dependem dessas respostas. Não avançar para `$speckit-plan` antes de escolhê-las.
- A plataforma de identidade aparece só como fronteira já existente (empresa ativa, administrador, convite e segredo fora do aplicativo). Caminho e corpo do serviço não foram fixados; o contrato será alinhado com a especificação paralela do serviço.
- Itens incompletos exigem atualização da especificação antes de `$speckit-clarify` ou `$speckit-plan`.
