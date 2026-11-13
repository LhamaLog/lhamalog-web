# Decisões frontend

[Pesquisa compartilhada](../../../lhamalog-core/specs/001-empresa-produtos/research.md).

Reutilizados AppLayout, Navbar, Header, Input, Button, Card, Badge, Pagination e estados existentes. Textarea introduzido para os contextos confirmados. Telas integradas não usam métricas demonstrativas nem simulam integrações. Layout se adapta a duas colunas/uma coluna conforme largura.

A autenticação existente não foi alterada. O transporte usa getToken, cancela consultas e verifica a organização antes de enviar. A empresa muda com chave React para descartar formulários/respostas antigos. Envio usa bloqueio imediato por ref e estado visual desabilitado. Conflitos exigem recarregar. 403 de negócio permanece na tela, conforme USID_030.1.
