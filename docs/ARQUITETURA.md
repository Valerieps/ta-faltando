# Arquitetura

O desenho técnico que o código não mostra sozinho.

- **Entra aqui:** as invariantes (o que precisa ser sempre verdade), o modelo de dados, o fluxo de
  eventos e as migrações.
- **Não entra aqui:** um passeio pelos arquivos (o código mostra), o porquê de cada decisão (`adr/`),
  o que falta construir (`ROADMAP.md`) e as regras de produto (`spec/`).

## Camadas

`domain` ← `application` ← `infrastructure` e `ui`. O domínio não importa nada de framework; a
aplicação define as portas (interfaces) que a infraestrutura implementa; a interface chama casos de
uso, nunca o banco direto.

Cada aparelho (o celular e o navegador do computador) trabalha sobre a sua cópia no IndexedDB
(ADR-005). A função `/api/sync` (Cloudflare Pages Functions) guarda a cópia compartilhada no D1 e
troca as mudanças com os aparelhos (ADR-007). Na fase 1b, outra função em `/api` lê a foto da nota
com a API do Claude e não guarda a foto (ADR-004).

## Invariantes

- Cada item tem no máximo um contexto padrão; vazio quer dizer "Sem contexto".
- Um item aparece no máximo uma vez como pendente na lista de um contexto.
- O preço pertence ao produto, nunca ao item.
- A chave de acesso de uma compra é única: uma nota lida duas vezes não é gravada de novo.
- Um produto está ligado a um item ou marcado como ignorado, nunca os dois.
- O CPF da nota nunca chega ao banco, nem ao IndexedDB nem ao D1.
- Todo registro sincronizado tem `id` gerado no aparelho, `updatedAt` e `deletedAt`; nada é
  apagado de verdade, só marcado, para o apagamento chegar ao outro aparelho.
- Entre duas versões do mesmo registro, vale a de `updatedAt` maior (ADR-007).

## Modelo de dados

A peça central é a separação entre **item** (o que vai na lista, ex.: "leite") e **produto** (o que
aparece na nota, ex.: "LEITE INTEG ITALAC 1L"). Um item tem vários produtos.

| Entidade | Campos principais | Observação |
| --- | --- | --- |
| Contexto | nome, ícone, ordem, ativo, agrupar por categoria, ordem das categorias | Uma lista de compras |
| Item | nome, contexto padrão (vazio = sem contexto), categoria, criado via (setup, manual, voz, lote, nota) | O catálogo é o conjunto dos itens |
| Entrada de lista | item, contexto, quantidade, observação, status (pendente, comprado), data de adição, data da compra | O contexto pode diferir do padrão do item ("só daquela vez") |
| Produto | descrição original, item ligado, ignorado | *(1b)* |
| Loja | nome, CNPJ, contexto padrão | *(1b)* |
| Compra | loja, data, total, chave de acesso (única), origem (foto, QR) | *(1b)* |
| Linha de compra | compra, produto, quantidade, unidade, valor unitário, valor total | *(1b)* |
| Sugestão | nome, contexto, categoria, posição | Dado estático do projeto, não fica no banco |

Regras derivadas:

- O histórico de preço de um produto é a lista das suas linhas de compra, ordenada por data.
- O último preço de um item é a linha de compra mais recente entre todos os produtos dele.
- O contexto onde um item foi realmente comprado é o contexto da loja da compra.

## Fluxo de eventos

O app não guarda um histórico de eventos: o estado atual é a fonte. As compras e as linhas de
compra são o histórico que importa.

Sincronização (ADR-007, ADR-008): uma mudança grava no IndexedDB e marca o registro como pendente.
Numa só requisição, o aparelho manda os pendentes e o seu cursor para `/api/sync`; o servidor
guarda no D1 a versão vencedora de cada registro, com um novo número de sequência, e devolve os
registros com sequência acima do cursor. O aparelho desmarca os pendentes que não mudaram nesse
meio-tempo, aplica a mesma regra aos que chegaram e avança o cursor, até não haver mais nada.

## Migrações

- Banco no aparelho: versão 1 do esquema Dexie (`src/infrastructure/dexie-store.ts`), com
  contextos, itens e entradas de lista, mais as tabelas internas `pending` (o que ainda não subiu)
  e `meta` (o id do aparelho e o cursor). Uma versão que já foi publicada nunca muda: a mudança
  entra na versão seguinte.
- Banco no servidor: o D1 guarda todos os registros numa tabela genérica, `records`, com o
  registro inteiro em JSON (ADR-008); um campo novo no app não pede migração no D1. As migrações
  do D1 ficam em `migrations/`.
- Backup: um arquivo JSON com `formato: "ta-faltando"` e `versao: 1`, com todas as tabelas do banco.
- Regra para mudar: uma versão só acrescenta campos opcionais; remover um campo leva duas versões.
  A importação aceita backups de qualquer versão anterior e os migra.
