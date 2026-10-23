# Roadmap

O que ainda não está pronto.

- **Entra aqui:** o que falta construir, onde o código ainda não segue o spec, o que foi adiado de
  propósito e as lacunas do spec que o agente decidiu sozinho.
- **Não entra aqui:** o que já está pronto (quando uma linha fica pronta, ela sai daqui; o git e as
  issues fechadas guardam o histórico), bugs e débito técnico (issues do GitHub) e as regras (`spec/`).

## Falta construir

| Feature | Fase | Spec | Observação |
| --- | --- | --- | --- |
| Sincronização: criar o banco D1 e o login Google do Cloudflare Access no painel | 1a | [spec/sincronizacao.md](spec/sincronizacao.md) | O código está pronto (ADR-008); falta o passo a passo da [issue #6](https://github.com/Valerieps/ta-faltando/issues/6) |
| Layout para a tela larga do computador | 1a | [spec/sincronizacao.md](spec/sincronizacao.md) | Sem microfone, QR code e modo compra obrigatórios |
| Setup: contextos, cápsulas, resumo | 1a | [spec/setup.md](spec/setup.md) | As filas saem da tabela do spec para um arquivo de dados |
| Catálogo, listas por contexto e "Sem contexto" | 1a | [spec/itens-e-contextos.md](spec/itens-e-contextos.md) | |
| Adicionar pelo catálogo, botão + com autocompletar, microfone, em lote | 1a | [spec/itens-e-contextos.md](spec/itens-e-contextos.md) | Microfone: ADR-006 |
| Modo compra | 1a | [spec/modo-compra.md](spec/modo-compra.md) | |
| Exportar, importar, lembrete de backup | 1a | [spec/backup.md](spec/backup.md) | |
| App instalável e offline (service worker) | 1a | [spec/modo-compra.md](spec/modo-compra.md) | |
| Função `/api` da leitura de nota | 1b | [spec/nota-fiscal.md](spec/nota-fiscal.md) | ADR-004; o login já vem da 1a |
| Leitura de nota: foto, QR code, ligação com o catálogo, revisão | 1b | [spec/nota-fiscal.md](spec/nota-fiscal.md) | |
| Último preço, detalhe do item, estimativa do total | 1b | [spec/precos.md](spec/precos.md) | |

## O código ainda não segue o spec

- O app ainda mostra uma tela provisória, só com o nome e o indicador de sincronização (`src/ui/App.tsx`).
- O modelo de dados no aparelho ainda não tem as tabelas da fase 1b (produto, loja, compra, linha de compra); elas entram numa nova versão do esquema Dexie.

## Adiado

- Recompra prevista, comparação entre lojas, pedidos de lojas online pelo e-mail, listas
  compartilhadas e gastos por contexto — depois da fase 1b ([SPEC.md](SPEC.md)).

## Revisar as lacunas que o agente decidiu

- [ ] A primeira versão foi dividida em duas fases: 1a (listas e sincronização) e 1b (nota e preços). ([SPEC.md](SPEC.md))
- [ ] A foto virou o caminho principal da nota, porque a consulta da SEFAZ-MG pede reCAPTCHA; o QR code dá só a chave e o CNPJ. ([spec/nota-fiscal.md](spec/nota-fiscal.md))
- [ ] Sem login, o app abre e funciona com os dados do aparelho, e sincroniza quando eu entro de novo. ([spec/sincronizacao.md](spec/sincronizacao.md))
- [ ] Apagar num aparelho apaga no outro, a não ser que eu tenha mudado o item depois no outro; o app mostra se há mudanças que não subiram. ([spec/sincronizacao.md](spec/sincronizacao.md))
- [ ] No computador, além de ver, eu adiciono, edito, risco e apago; o backup existe nos dois aparelhos. ([spec/sincronizacao.md](spec/sincronizacao.md), [spec/backup.md](spec/backup.md))
- [ ] "Lista padrão" passou a se chamar "adicionar pelo catálogo". ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] Um item novo digitado entra no catálogo; um contexto "Outro" começa sem sugestões. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md), [spec/setup.md](spec/setup.md))
- [ ] O microfone usa o reconhecimento de voz do Chrome, que manda o áudio para o Google. ([SEGURANCA.md](SEGURANCA.md))
- [ ] Importar um backup mostra o conteúdo e pede confirmação antes. ([spec/backup.md](spec/backup.md))
