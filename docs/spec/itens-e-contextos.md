# Itens e contextos

Eu adiciono o que está faltando sem pensar em qual lista: o app coloca cada item no contexto certo.

- **Entra aqui:** as formas de adicionar, como o app escolhe o contexto, os itens sem contexto, a
  tela das listas, as telas do celular e do computador.
- **Não entra aqui:** riscar, agrupar e finalizar a compra (`modo-compra.md`) e o último preço
  mostrado em cada item (`precos.md`).

## Telas do celular e do computador

- No celular, o app abre nas listas. Um **+** redondo no meio da barra do pé não muda de tela:
  no lugar da barra aparece o campo de adicionar, já focado, com o teclado aberto. O enter
  adiciona o item e limpa o campo para o próximo; quando eu saio do campo ou recolho o teclado,
  a barra volta. *(1a)*
  Por quê: no celular eu quase sempre adiciono um item por vez, no meio do dia; o + fica a um
  toque, sob o polegar, e eu continuo vendo a lista em que estava.
- No celular, uma barra no pé das telas tem **Listas**, o **+** e **Catálogo**, nessa ordem. A
  captura e o lote não têm a barra. *(1a)*
- No celular, as listas e o catálogo têm no topo uma barra com o nome do app e, no canto
  direito, o círculo com as minhas iniciais, que abre o Perfil. *(1a)*
- No celular, tudo que eu toco fica na parte de baixo da tela, do lado da mão escolhida
  (`modo-compra.md`). O campo do + e o da captura ficam colados no teclado, e o autocompletar
  abre para cima. A captura é a tela aberta pelo atalho do ícone do app. *(1a)*
- No computador, o app abre nas listas, uma coluna por contexto, com a caixa do lote ao lado. *(1a)*
  Por quê: no computador eu vejo tudo de uma vez e adiciono em lote.
- Quando eu seguro o dedo no ícone do app, aparecem atalhos para a captura, as listas, o
  catálogo e o lote; cada atalho pode ser arrastado para a tela inicial. No computador, os mesmos
  atalhos aparecem no clique direito no ícone do app instalado. *(1a)*
  Por quê: o Chrome não deixa um PWA ter widget na tela inicial; o atalho é o mais perto disso.

- No Catálogo, eu escolho o contexto num menu. Um + à esquerda do menu cria um contexto novo, e o
  lápis à direita edita o contexto aberto (nome, posição, categorias, desativar). Não há uma tela
  de Contextos. *(1a)*
- Acima do menu, uma busca procura nos catálogos de todos os contextos; cada item achado mostra
  os seus contextos. O enter põe um nome novo no catálogo do contexto aberto e já na lista. *(1a)*
- No catálogo, um carrinho antes do item mostra se ele está na lista (cheio) ou não (vazio), e o
  lápis depois dele abre o detalhe do item. *(1a)*
- No detalhe do item, uma lixeira tira o item do catálogo num toque só, sem pedir confirmação. *(1a)*
- No celular, a tela das listas também edita os contextos: o menu que abre no nome da lista tem
  "Editar …", que edita o contexto aberto (nome, posição, categorias, desativar), e "Novo
  contexto", que cria um. *(1a)*
  Por quê: era difícil achar onde se editava um contexto.
- No celular, a tela Perfil, aberta pelo círculo do topo, reúne a conta e todos os ajustes: um
  círculo com as minhas iniciais, tiradas do e-mail da conta Google, o meu e-mail, o estado da sincronização, a mão, o
  backup, refazer o setup e sair (ou entrar, se eu estiver sem login). *(1a)*
  Por quê: é onde eu procuro os ajustes de um app.
- No celular, a tela das listas já é o modo compra (`modo-compra.md`). O carrinho ao lado do
  campo da captura pergunta em qual lista com itens faltando eu vou comprar e abre essa lista. *(1a)*

## Formas de adicionar

Em todas, o item vai para as listas dos seus contextos, e um item sem contexto vai para "Sem
contexto", sem nenhuma pergunta na hora.

| Forma | Como funciona | Melhor para |
| --- | --- | --- |
| Pelo catálogo | Abro o catálogo de um contexto (tudo o que eu costumo comprar ali) e toco nos itens que estão faltando. Os que já estão na lista aparecem marcados | Montar a lista antes da compra do mês |
| Botão + | Um campo com autocompletar a partir do catálogo, tolerante a acento e erro de digitação ("agua sanitaria" encontra "Água sanitária") | Lembrar de um item no meio do dia |
| Em lote | Uma caixa de texto em que cada linha ou vírgula vira um item; aceita colar uma lista de outro app ou de uma mensagem | Migrar listas antigas ou copiar de uma conversa |

- As três formas valem desde a fase 1a. *(1a)*
- Quantidade e observação são opcionais e vêm no próprio texto: o número no começo é a
  quantidade, e o que vem depois de dois-pontos é a observação ("2 leite: sem lactose"). Sem
  dois-pontos, tudo é o nome: "leite sem lactose" é um item próprio. *(1a)*
- Um item que já está na lista e é adicionado de novo fica como está, e a Tatá avisa que ele já
  estava lá. Se eu digito uma quantidade ou observação nova, ela substitui a antiga. *(1a)*
- No lote, os itens se separam por vírgula, quebra de linha e a palavra "e". Antes de
  salvar, uma tela mostra os itens separados para eu conferir. *(1a)*
- No computador, nessa conferência do lote, o contexto de cada item é uma lista de escolha, mesmo
  quando o app não achou nenhum ("Sem contexto"). Se eu escolho ali um contexto que não é do item,
  ele vira o único contexto do item. *(1a)*
- Um item que não está no catálogo entra no catálogo quando eu o adiciono. *(1a)*
- Depois de adicionado, um toque no item me deixa mudar os contextos dele, ou pôr o item só
  daquela vez na lista de outro contexto. *(1a)*

## Como o app escolhe o contexto

1. **Item já no catálogo:** vai para os contextos dele. *(1a)*
2. **Item novo que está nas filas de sugestões do setup:** usa o contexto da sugestão. *(1a)*
3. **Item totalmente novo:** entra em "Sem contexto", sem pergunta na hora. *(1a)*

## Itens sem contexto

- Ficam numa aba própria, "Sem contexto", com um contador visível na tela inicial. *(1a)*
- Na aba, cada item mostra os contextos como botões: um toque vincula o item a esse contexto. *(1a)*
- Eu posso selecionar vários itens e vincular todos de uma vez. *(1a)*
- Quando o item aparece numa nota fiscal, o contexto da loja vincula o item sozinho. *(1b)*

## Item em mais de um contexto

- Um item pode ter mais de um contexto (ex.: shampoo em Farmácia e Mercado). Eu marco e desmarco
  os contextos no detalhe do item, aberto pelo item na lista ou no catálogo; o setup e o lote dão
  um contexto só. *(1a)*
- A categoria é do item, a mesma em todos os contextos dele. *(1a)*
- Quando eu adiciono um item, por qualquer contexto dele, ele aparece nas listas de todos os seus
  contextos e no catálogo de cada um. Comprado num deles, sai de todas. *(1a)*
- O contador de itens faltando de cada lista conta os itens daquela lista; o total do botão
  Listas conta cada item uma vez só, mesmo que ele esteja em várias listas. *(1a)*
- Um item posto numa lista "só daquela vez" fica só nela. *(1a)*
- Quando eu desmarco um contexto do item, o item que estava faltando continua nas listas dos
  outros contextos dele; sem nenhum contexto, vai para "Sem contexto". *(1a)*
- Se as 3 últimas compras de um item foram num contexto diferente do padrão, o app sugere trocar
  (ex.: "Você tem comprado shampoo no mercado. Mover para Mercado?"). *(1b)*

## Tela das listas

- Uma lista por contexto, mais a lista "Sem contexto", cada uma com o contador de itens que estão
  faltando. No computador, uma coluna por lista; no celular, o nome da lista no topo abre um menu
  com todas elas: em cima as que têm itens faltando, embaixo as vazias. *(1a)*
- No celular, a tela das listas é o modo compra: a bolinha à esquerda e os gestos riscam e contam
  como comprado, e o ícone de agrupar fica na mesma linha do nome da lista, à direita
  (`modo-compra.md`). *(1a)*
- Eu ligo ou desligo o agrupamento por categoria em cada lista (`modo-compra.md`). *(1a)*
- No celular, no fim de cada lista, vazia ou não, há um link para abrir o catálogo daquele
  contexto. *(1a)*
- Cada item mostra, em texto discreto, o último preço pago (`precos.md`). *(1b)*
