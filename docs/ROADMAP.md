# Roadmap

O que ainda não está pronto.

- **Entra aqui:** o que falta construir, onde o código ainda não segue o spec, o que foi adiado de
  propósito e as lacunas do spec que o agente decidiu sozinho.
- **Não entra aqui:** o que já está pronto (quando uma linha fica pronta, ela sai daqui; o git e as
  issues fechadas guardam o histórico), bugs e débito técnico (issues do GitHub) e as regras (`spec/`).

## Falta construir

| Feature | Fase | Spec | Observação |
| --- | --- | --- | --- |
| Banco no celular (IndexedDB) e o modelo de dados | 1a | [ARQUITETURA.md](ARQUITETURA.md) | Base de tudo; ADR-005 |
| Setup: contextos, cápsulas, resumo | 1a | [spec/setup.md](spec/setup.md) | As filas saem da tabela do spec para um arquivo de dados |
| Catálogo, listas por contexto e "Sem contexto" | 1a | [spec/itens-e-contextos.md](spec/itens-e-contextos.md) | |
| Adicionar pelo catálogo, botão + com autocompletar, microfone, em lote | 1a | [spec/itens-e-contextos.md](spec/itens-e-contextos.md) | Microfone: ADR-006 |
| Modo compra | 1a | [spec/modo-compra.md](spec/modo-compra.md) | |
| Exportar, importar, lembrete de backup | 1a | [spec/backup.md](spec/backup.md) | |
| App instalável e offline (service worker) | 1a | [spec/modo-compra.md](spec/modo-compra.md) | |
| Funções `/api` no Cloudflare e login Google pelo Cloudflare Access | 1b | [spec/nota-fiscal.md](spec/nota-fiscal.md) | ADR-004; abre `connect-src` para a própria origem |
| Leitura de nota: foto, QR code, ligação com o catálogo, revisão | 1b | [spec/nota-fiscal.md](spec/nota-fiscal.md) | |
| Último preço, detalhe do item, estimativa do total | 1b | [spec/precos.md](spec/precos.md) | |

## O código ainda não segue o spec

- O app ainda mostra a tela de exemplo do template (`src/ui/App.tsx`).

## Adiado

- Recompra prevista, comparação entre lojas, pedidos de lojas online pelo e-mail, listas
  compartilhadas e gastos por contexto — depois da fase 1b ([SPEC.md](SPEC.md)).

## Revisar as lacunas que o agente decidiu

- [ ] A primeira versão foi dividida em duas fases: 1a (listas, sem servidor) e 1b (nota e preços). ([SPEC.md](SPEC.md))
- [ ] A foto virou o caminho principal da nota, porque a consulta da SEFAZ-MG pede reCAPTCHA; o QR code dá só a chave e o CNPJ. ([spec/nota-fiscal.md](spec/nota-fiscal.md))
- [ ] O login Google vale só para a leitura de nota; as listas funcionam sem login e os dados ficam no celular. ([spec/nota-fiscal.md](spec/nota-fiscal.md))
- [ ] "Lista padrão" passou a se chamar "adicionar pelo catálogo". ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] Um item novo digitado entra no catálogo; um contexto "Outro" começa sem sugestões. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md), [spec/setup.md](spec/setup.md))
- [ ] O microfone usa o reconhecimento de voz do Chrome, que manda o áudio para o Google. ([SEGURANCA.md](SEGURANCA.md))
- [ ] Importar um backup mostra o conteúdo e pede confirmação antes. ([spec/backup.md](spec/backup.md))
