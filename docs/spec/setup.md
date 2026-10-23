# Setup

No primeiro uso, o setup me leva da escolha dos contextos a um catálogo inicial pronto, em cerca de
2 minutos.

- **Entra aqui:** as telas do setup, o comportamento das cápsulas e as filas de sugestões.
- **Não entra aqui:** como um item novo escolhe o contexto depois do setup (`itens-e-contextos.md`).

## Em aberto

- [ ] Que ícone cada contexto sugerido usa?

## Telas

1. **Boas-vindas:** uma tela curta explica o que o app faz e quanto tempo o setup leva. *(1a)*
2. **Escolha de contextos:** cartões selecionáveis para os 6 contextos sugeridos (Mercado,
   Hortifrúti, Padaria, Farmácia, Pet shop, Lojas online) e "Outro", com campo para um nome livre
   (ex.: papelaria). *(1a)*
3. **Uma tela por contexto escolhido:** "O que você costuma comprar em [contexto]?", com 8 cápsulas
   de sugestão e um campo para eu digitar itens. *(1a)*
4. **Resumo:** quantos itens entraram em cada contexto e o botão "Começar". *(1a)*

- Eu posso pular qualquer passo e refazê-lo depois nas configurações. *(1a)*
- Um contexto "Outro" começa sem sugestões: só o campo para digitar. *(1a)*

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
  Por quê: cada item tem um único contexto padrão.

## Filas de sugestões

Cada contexto tem uma fila fixa, da sugestão mais comum para a menos comum. As 8 primeiras misturam
categorias, para a tela não ficar toda de um tipo; as demais entram uma a uma, na ordem.

| Contexto | Na tela ao abrir (1 a 8) | Fila de reposição, na ordem (9 em diante) |
| --- | --- | --- |
| Mercado | arroz, feijão, café, leite, ovos, açúcar, óleo, macarrão | molho de tomate, sal, manteiga, queijo, iogurte, biscoito, farinha de trigo, papel higiênico, detergente, sabão em pó, amaciante, esponja, sabonete, pasta de dente, papel toalha, saco de lixo, água sanitária, desinfetante |
| Hortifrúti | banana, tomate, cebola, alho, batata, alface, limão, maçã | cenoura, laranja, mamão, abobrinha, pimentão, brócolis, cheiro-verde, mandioca, abacate, uva, pepino, manga, beterraba, couve |
| Padaria | pão francês, pão de forma, pão de queijo, queijo fatiado, presunto fatiado, bolo, requeijão, croissant | pão integral, torrada, biscoito de polvilho, sonho, rosca, salgado, pão de hambúrguer, pão sírio, broa de milho, mortadela, peito de peru |
| Farmácia | dipirona, paracetamol, protetor solar, fio dental, curativo, álcool 70%, shampoo, desodorante | condicionador, escova de dente, absorvente, hidratante, antialérgico, soro fisiológico, algodão, cotonete, vitamina, colírio, lâmina de barbear, repelente, antisséptico bucal, termômetro |
| Pet shop | ração, petisco, areia higiênica, tapete higiênico, antipulgas, vermífugo, sachê de ração úmida, brinquedo | saquinho para fezes, mordedor, shampoo pet, escova pet, coleira, guia, comedouro, bebedouro, arranhador, cama pet |
| Lojas online | cápsulas de café, pilhas, lâmpada, refil de filtro de água, cabo USB, carregador, suplemento, livro | fone de ouvido, capinha de celular, meias, roupa íntima, skincare, perfume, material de escritório, utensílio de cozinha, organizadores, presente |

- As filas ficam num arquivo de dados do projeto, para eu editar sem mexer no código. Quando esse
  arquivo existir, ele passa a ser a fonte das filas e esta tabela sai daqui. *(1a)*
- Cada sugestão traz uma categoria (ex.: hortifrúti, laticínios, limpeza, higiene), usada para
  agrupar a lista no modo compra. Essas são as categorias do app; eu não crio categorias
  próprias. *(1a)*
