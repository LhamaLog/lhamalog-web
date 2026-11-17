# Contrato: `/sign-in` com aviso e destino de volta

## URL

```text
/sign-in?motivo=deslogado&redirect_url=<destino codificado>
```

| Parâmetro | Obrigatório | Efeito |
|---|---|---|
| `motivo=deslogado` | não | mostra "Você foi deslogado. Entre novamente." |
| `redirect_url` | não | destino depois do login, só se passar na validação de [data-model.md](../data-model.md) ("Destino de volta"); senão `/` |

## Comportamento da tela

| Estado | Resultado |
|---|---|
| sessão ativa | vai direto para o destino validado (`replace`) |
| sessão `pending` | segue para as telas de tarefa da Clerk (ADR_024), sem usar o destino |
| sem sessão | mostra o `<SignIn>`; depois do login, vai para o destino validado |

## Exemplos

| `redirect_url` | Destino |
|---|---|
| `%2Fprodutos` | `/produtos` |
| `%2Fprodutos%3Fpagina%3D2` | `/produtos?pagina=2` |
| `https%3A%2F%2Fevil.example` | `/` |
| `%2F%2Fevil.example` | `/` |
| `%2F%5Cevil.example` | `/` |
| `javascript%3Aalert(1)` | `/` |
| `%2Fsign-in` | `/` |
| ausente | `/` |
