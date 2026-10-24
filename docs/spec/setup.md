# Setup

No primeiro uso, o setup me leva da escolha dos contextos a um catálogo inicial pronto, em cerca de
2 minutos.

- **Entra aqui:** as telas do setup, o comportamento das cápsulas e as filas de sugestões.
- **Não entra aqui:** como um item novo escolhe o contexto depois do setup (`itens-e-contextos.md`).

## Telas

- Antes das boas-vindas, uma tela da Tatá me recebe e oferece "Entrar com Google"
  (`sincronizacao.md`). Se eu já uso o app em outro aparelho, os meus dados chegam e o setup nem
  abre. "Agora não" leva às boas-vindas sem login. *(1a)*
  Por quê: num aparelho novo eu quero os meus dados, não um catálogo do zero.

1. **Boas-vindas:** uma tela curta explica o que o app faz e quanto tempo o setup leva. *(1a)*
2. **Escolha de contextos:** cartões selecionáveis para os 6 contextos sugeridos (Mercado,
   Hortifrúti, Padaria, Farmácia, Pet shop, Lojas online) e "Outro", com campo para um nome livre
   (ex.: papelaria). *(1a)*
3. **Uma tela por contexto escolhido:** "O que você costuma comprar em [contexto]?", com 8 cápsulas
   de sugestão e um campo para eu digitar itens. *(1a)*
4. **Resumo:** quantos itens entraram em cada contexto e o botão "Começar". *(1a)*

- Eu posso pular qualquer passo e refazê-lo depois nas configurações. *(1a)*
- Um contexto "Outro" começa sem sugestões: só o campo para digitar. *(1a)*
- Os contextos não têm ícone: as abas e as colunas mostram só o nome. *(1a)*

## Cápsulas

- A tela mostra sempre 8 cápsulas: ao abrir, as 8 primeiras da fila do contexto. *(1a)*
- Quando eu toco numa cápsula, ela esmaece numa animação curta (cerca de 300 ms) e entra na lista
  "Selecionados", visível na mesma tela. *(1a)*
- No mesmo lugar surge a próxima sugestão da fila; as outras cápsulas não mudam de posição. *(1a)*
  Por quê: se as cápsulas pulassem de lugar, eu tocaria na errada.
- Tocar num item selecionado o desfaz, e a sugestão volta para a frente da fila. *(1a)*
- Quando a fila acaba, o espaço fica vazio e o campo para digitar continua disponível. *(1a)*
- O que eu digito entra como selecionado e no catálogo daquele contexto. *(1a)*
- Um item escolhido num contexto sai da fila dos outros (ex.: pão de forma escolhido em Padaria
  não aparece mais em Mercado). *(1a)*
  Por quê: no setup, cada item fica num contexto só; os outros eu marco depois, no detalhe do
  item (`itens-e-contextos.md`).

## Filas de sugestões

Cada contexto tem uma fila fixa, da sugestão mais comum para a menos comum. As 8 primeiras misturam
categorias, para a tela não ficar toda de um tipo; as demais entram uma a uma, na ordem.


- As filas ficam em [`src/data/sugestoes.json`](../../src/data/sugestoes.json), para eu editar sem
  mexer no código: cada contexto com a sua fila, na ordem, e cada sugestão com a sua categoria.
  O mesmo arquivo lista as categorias do app. *(1a)*
- Cada sugestão traz uma categoria (ex.: hortifrúti, laticínios, limpeza, higiene), usada para
  agrupar a lista no modo compra. Essas são as categorias do app; cada contexto começa com as das
  suas sugestões, e eu mudo as de cada um (`modo-compra.md`). *(1a)*
  Por quê: nem tudo cabe nas categorias do app.
