# ADR: Limite sem chave secreta na gestão de usuários

- **Status**: aceita
- **Data**: 2026-11-17
- **História**: LLT-168

## Contexto

A LLT-168 lista, edita cargo e desativa usuários em `/equipe`. O Web não recebe `CLERK_SECRET_KEY` nem valor `sk_`. O Core também não tem essa chave e não consulta a organização na Clerk. A troca de cargo usa `organization.updateMember` do SDK, na sessão do administrador. Desativar grava uma marca no Core com `POST /api/company/members/{userId}/deactivation`. A pessoa continua na organização: a tela não chama `membership.destroy` nem `organization.removeMember`.

## Decisão

O produto aceita o limite de não haver chave secreta no backend.

- **M1.** Rebaixar o último administrador é barrado só no navegador. A troca de cargo não passa pelo Core. A tela conta os administradores ativos e, se a ação deixasse zero, recusa com "Não é possível rebaixar o último administrador." sem chamar `organization.updateMember`. Quem chamar a Clerk fora dessa tela pode rebaixar o último administrador. O Core só recusa desativar o último administrador que ele conhece (`403`, `code` `last_admin`).
- **M2.** Um administrador desativado no Core ainda pode agir direto na Clerk. A marca recusa a próxima requisição ao serviço, mas a pessoa não sai da organização e a sessão da plataforma permanece. Cargo, convite e demais ações da organização continuam disponíveis para quem a Clerk ainda trata como administrador.

## Consequências

- A garantia de "não rebaixar o último administrador" vale na tela `/equipe`. Não é uma regra da Clerk nem do Core.
- Desativado não é o mesmo que removido da organização. O corte de acesso vale para o serviço, na próxima requisição autenticada.
- Divergência entre a contagem da tela e a do Core continua possível. A tela mostra o erro devolvido e não aplica a mudança que falhou.

## Quando revisitar

Revisitar se o projeto adotar chave secreta no backend. Com ela, o serviço pode impor o último administrador na troca de cargo e pode retirar ou bloquear a associação na Clerk, para que um administrador desativado no Core deixe de agir direto na plataforma. Até lá, M1 e M2 permanecem.
