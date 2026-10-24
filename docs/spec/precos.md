# Preços

O app me mostra quanto eu paguei da última vez, pelo nome completo do produto da nota.

- **Entra aqui:** o último preço ao adicionar, a tela de detalhe do item, o preço na lista e a
  estimativa do total.
- **Não entra aqui:** de onde os preços vêm (`nota-fiscal.md`).

## Ao adicionar um item

Logo abaixo do campo, o app mostra a última compra do item:

> Leite — última vez: **ITALAC INTEG 1L · R$ 5,49** · Pão de Açúcar · 12/out

- O preço é mostrado pelo produto, com o nome completo da nota, que já traz marca e tamanho. *(1b)*
  Por quê: assim o app não precisa converter unidades.
- Se o item tem mais de um produto comprado (marcas ou tamanhos diferentes), aparece o mais recente,
  com um link "ver outros". *(1b)*
- Item sem nenhuma compra registrada não mostra nada. *(1b)*
- Itens vendidos por peso (hortifrúti, carne) mostram o preço por kg da nota (ex.: "TOMATE
  ITALIANO KG · R$ 8,99/kg"). *(1b)*

## Detalhe do item

- A lista de produtos já comprados, cada um com o último preço, a loja e a data. *(1b)*
- Ao tocar num produto, abre o histórico dele, da compra mais recente para a mais antiga: data,
  loja, preço unitário. *(1b)*
- Com 5 compras ou mais, um gráfico de linha mostra o preço do produto ao longo do tempo. *(1b)*
- Eu edito aqui o nome do item, os contextos e a categoria. *(1a)*

## Na lista

- Cada item que está faltando mostra o último preço em texto discreto. *(1b)*
- O topo da lista mostra uma estimativa do total (a soma dos últimos preços dos itens que têm
  histórico), com aviso de quantos itens ficaram de fora da conta. *(1b)*
