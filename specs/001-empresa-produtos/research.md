# Decisões frontend

[Pesquisa compartilhada](../../../lhamalog-core/specs/001-empresa-produtos/research.md).

Reutilizados AppLayout, Navbar, Header, Input, Button, Card, Badge, Pagination e estados existentes. Textarea introduzido para os contextos confirmados. Telas integradas não usam métricas demonstrativas nem simulam integrações. Layout se adapta a duas colunas/uma coluna conforme largura.

A autenticação existente não foi alterada. O transporte usa getToken, cancela consultas e verifica a organização antes de enviar. A empresa muda com chave React para descartar formulários/respostas antigos. Envio usa bloqueio imediato por ref e estado visual desabilitado. Conflitos exigem recarregar. 403 de negócio permanece na tela, conforme USID_030.1. Atualização (spec 006, 2026-11-17): vale para 403 com `code` ou mensagem do Core; o 403 de segurança (`{"error":"forbidden"}`, sem `code` e sem mensagem) encerra a sessão e leva ao login.
