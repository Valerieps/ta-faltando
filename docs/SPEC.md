# Spec

O que o app faz. É a fonte da verdade: quando outro documento diverge daqui, vale o spec.

- **Entra aqui:** o que o app é, para quem, as fases e qual arquivo de `spec/` cobre cada feature.
- **Não entra aqui:** as regras em si (ficam em `spec/`), o que falta construir (`ROADMAP.md`) e
  como o app é construído (`ARQUITETURA.md` e `adr/`).

## O app

O Tá faltando guarda as listas de compras da minha casa separadas por contexto: mercado,
farmácia, pet shop, lojas online. Eu digito "leite" e o item cai na lista certa; no mercado, uso a
lista com uma mão só; depois leio a nota fiscal, e o app aprende o que eu compro, onde e por
quanto. É só para mim, no meu celular Android, sem conta: os dados ficam no aparelho.

Objetivos:

1. **Começar cheio, não vazio:** o setup monta um catálogo inicial por contexto em poucos minutos.
2. **Adicionar sem pensar onde:** eu digito o item e o app escolhe a lista.
3. **Saber quanto paguei:** ao adicionar um item, vejo o último produto comprado, com preço, loja e data.
4. **Catálogo que cresce sozinho:** cada nota lida acrescenta itens e preços.

## Fases

Cada fase precisa ser usável sozinha. Cada regra em `spec/` diz de que fase vale, como *(1a)*.

| Fase | O que entra |
| --- | --- |
| 1a | Setup, catálogo, listas por contexto, as quatro formas de adicionar, modo compra, backup. Funciona sem internet e sem servidor |
| 1b | Leitura de nota fiscal (foto + QR code), histórico de preços, login com Google para a leitura de nota |
| Depois | Sem ordem definida: recompra prevista ("você compra café a cada 3 semanas"), comparação de preço entre lojas, importar pedidos de lojas online pelo e-mail, listas compartilhadas com outra pessoa da casa, gastos por contexto no mês |

## Arquivos

| Arquivo | O que cobre |
| --- | --- |
| [spec/setup.md](spec/setup.md) | O setup do primeiro uso: contextos, cápsulas e as filas de sugestões |
| [spec/itens-e-contextos.md](spec/itens-e-contextos.md) | Adicionar itens, como o app escolhe o contexto, itens sem contexto, a tela das listas |
| [spec/modo-compra.md](spec/modo-compra.md) | A lista em tela cheia dentro da loja: uma mão, categorias, marcar e finalizar |
| [spec/backup.md](spec/backup.md) | Exportar e importar os dados, e os riscos de guardar tudo no celular |
| [spec/nota-fiscal.md](spec/nota-fiscal.md) | Ler a nota, ligar cada produto a um item, revisar e gravar |
| [spec/precos.md](spec/precos.md) | O último preço pago, o histórico e a estimativa do total |
| [spec/_modelo.md](spec/_modelo.md) | Modelo para um arquivo de feature novo |

Os termos estão definidos em [GLOSSARIO.md](GLOSSARIO.md).
