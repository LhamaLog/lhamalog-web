# Contrato: recusas do Core lidas pelo Web

Fonte: `lhamalog-core`, `specs/002-validacao-token-clerk/contracts/http-security.md` (LLT-163) e `specs/005-listar-editar-usuarios/contracts/company-members.md` (LLT-168).

## Respostas

| Situação | Status | Corpo | Revogação na Clerk | Web |
|---|---|---|---|---|
| Sem token, token inválido, expirado, `azp`/`iss` errado, `sts` diferente de `active` | 401 | `{"error":"unauthorized"}` | não | encerra a sessão local |
| Sem organização no token, sem Tenant, Tenant não ativo ou papel desconhecido | 403 | `{"error":"forbidden"}` | sim, todas as sessões do usuário | encerra a sessão local |
| Não administra a empresa | 403 | `{"code":"not_admin","message":"Somente o administrador da empresa pode gerenciar os usuários."}` | não | mantém e mostra `message` |
| Usuário desativado na empresa | 403 | `{"code":"user_deactivated","message":"Seu acesso a esta empresa foi desativado."}` | não | mantém e mostra `message` |
| Membro altera o cadastro da empresa ou arquiva produto | 403 | hoje `{"message":"Somente ..."}`; com a spec 008 do Core, `{"code":"not_admin","message":"Somente ..."}` | não | mantém e mostra `message` |
| Último administrador | 403 | `{"code":"last_admin","message":"Não é possível desativar o último administrador."}` | não | mantém e mostra `message` |
| Produto inexistente ou de outra empresa | 404 | corpo de erro | não | mantém e mostra a mensagem |

## Regra do Web

```text
401                               -> encerrar
403 sem code e sem message        -> encerrar
403 com code ou message           -> manter
qualquer outro                    -> manter
```

O cadastro da empresa e o arquivamento de produto ainda respondem 403 só com `message`; a spec 008 do Core acrescenta `code` `not_admin`. Até lá, a `message` basta para manter a sessão.

O Web não revoga sessões na Clerk: só encerra a sessão local (ADR_032).
