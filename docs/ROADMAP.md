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
| App instalável e offline (service worker) | 1a | [spec/modo-compra.md](spec/modo-compra.md) | |
| Função `/api` da leitura de nota | 1b | [spec/nota-fiscal.md](spec/nota-fiscal.md) | ADR-004; o login já vem da 1a |
| Leitura de nota: foto, QR code, ligação com o catálogo, revisão | 1b | [spec/nota-fiscal.md](spec/nota-fiscal.md) | |
| Último preço, detalhe do item, estimativa do total | 1b | [spec/precos.md](spec/precos.md) | |

## O código ainda não segue o spec

- A Tatá ainda não pisca na captura (rascunho da identidade, "Movimento").
- O lembrete de backup aparece como fala da Tatá na captura e nos ajustes; não há notificação fora do app.
- O modelo de dados no aparelho ainda não tem as tabelas da fase 1b (produto, loja, compra, linha de compra); elas entram numa nova versão do esquema Dexie.

## Adiado

- Adicionar falando, pelo microfone: saiu do app em 2026-10 porque não funcionava no meu celular.
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
- [ ] Importar um backup mostra o conteúdo e pede confirmação antes. ([spec/backup.md](spec/backup.md))
- [ ] O item que sai da lista pelo segundo deslize ou pela lixeira esmaece por 3 segundos. ([spec/modo-compra.md](spec/modo-compra.md))
- [ ] Um item novo só fica com a categoria da sugestão se o contexto dele tiver essa categoria; sem contexto, ele guarda a categoria para quando ganhar um. ([spec/modo-compra.md](spec/modo-compra.md))
- [ ] A lixeira também existe no modo compra, e o "Desfazer" aparece no próprio item enquanto ele esmaece. ([spec/modo-compra.md](spec/modo-compra.md))
- [ ] "Sem gestos, só a lixeira" vale para a tela das listas do celular; no computador eu continuo riscando nas listas. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md), [spec/sincronizacao.md](spec/sincronizacao.md))
- [ ] No computador, os riscados de uma lista saem por um "Finalizar compra" no pé da coluna, já que lá não há modo compra. ([spec/sincronizacao.md](spec/sincronizacao.md))
- [ ] As categorias do app e a categoria de cada sugestão (ex.: ovos em Laticínios, papel higiênico em Higiene) foram escolhidas pelo agente, em `src/data/sugestoes.json`. ([spec/setup.md](spec/setup.md))
- [ ] O tablet (600 a 1023 px) usa as telas do celular, não as duas colunas do rascunho; o layout do computador começa em 1024 px. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] O contexto escolhido na conferência do lote no computador vira o padrão do item, não vale "só daquela vez". ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] O lápis da cápsula também move o contexto entre as abas e o desativa; um contexto desativado volta quando eu crio um com o mesmo nome no +. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] A mão, o setup feito e a data do último backup são de cada aparelho e não sincronizam. ([spec/modo-compra.md](spec/modo-compra.md), [spec/backup.md](spec/backup.md))
- [ ] O setup só abre num aparelho sem contextos; sem internet, com "Agora não" ou se eu voltar do login ainda sem entrar, as boas-vindas abrem sem login. ([spec/setup.md](spec/setup.md), [spec/sincronizacao.md](spec/sincronizacao.md))
- [ ] Refazer o setup só acrescenta: os itens que já estão no catálogo ficam, e um item que já tem contexto não muda. ([spec/setup.md](spec/setup.md))
- [ ] Na captura, o enter anota exatamente o que digitei; a sugestão do autocompletar entra com um toque nela. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] No catálogo, o campo filtra os itens, e o enter põe um nome novo no catálogo e já na lista. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] Um contexto desativado sai das abas, e os seus itens aparecem em "Sem contexto" até eu vinculá-los de novo. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] No celular, os ajustes ficam no menu do perfil; o "Backup" dele abre a tela de Ajustes, e no computador eles continuam no menu lateral. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md), [spec/backup.md](spec/backup.md))
- [ ] O carrinho da captura mostra só as listas com itens faltando; o "Sair" encerra o login do Cloudflare Access e deixa os dados no aparelho. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] Na tela das listas, as abas continuam no pé, perto do polegar; só o nome, o lápis e o avatar ficam no topo. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
- [ ] O modo compra tem um "Desfazer" na barra, para o último gesto, além do "Desfazer" no próprio item. ([spec/modo-compra.md](spec/modo-compra.md))
- [ ] Os atalhos do ícone são Adicionar, Listas, Catálogo e Em lote; o modo compra ficou de fora, porque um atalho não sabe em qual contexto entrar. ([spec/itens-e-contextos.md](spec/itens-e-contextos.md))
