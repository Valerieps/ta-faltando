# Nota fiscal

A nota fiscal acrescenta ao catálogo os itens que ainda não estão lá e registra o preço de cada
produto comprado.

- **Entra aqui:** a captura da nota, a ligação de cada produto a um item, a revisão, as notas
  repetidas e o login.
- **Não entra aqui:** como os preços aparecem depois (`precos.md`).

## Em aberto

- [ ] Nota comprida, que não cabe numa foto: tiro várias fotos da mesma nota, ou uma foto com a nota dobrada?
- [ ] Vale ter um segundo caminho sem foto: eu abro a consulta da SEFAZ no navegador, resolvo o
  captcha e compartilho a página com o app?

## Captura

O caminho principal é a foto. A consulta pública da SEFAZ-MG pede um reCAPTCHA antes de mostrar a
nota, então o app não consegue lê-la sozinho (ADR-004).

1. **Foto:** eu fotografo a nota; o app manda a foto para um modelo de visão, que devolve a loja
   (nome e CNPJ), a data e cada produto com descrição, quantidade, unidade, valor unitário e
   total. *(1b)*
2. **QR code:** se o QR code da NFC-e aparece na foto (ou eu o leio com a câmera), o app tira dele a
   chave de acesso e o CNPJ da loja, sem depender do modelo. *(1b)*
3. **Contexto da compra:** o app sugere o contexto pela loja. Uma loja já vista usa o contexto da
   última vez; numa loja nova, eu escolho (ex.: "Drogasil → Farmácia"), e a escolha fica gravada
   para a loja. *(1b)*

- Depois que eu confirmo a revisão, a foto é apagada; ficam só os dados. *(1b)*
- O CPF que aparece na nota nunca é gravado. *(1b)*
- A leitura de nota precisa de internet; o resto do app não. *(1b)*

## Login

- Para ler uma nota, eu entro com a minha conta Google; só a minha conta é aceita. *(1b)*
  Por quê: sem login, qualquer pessoa que descobrisse o endereço gastaria meus créditos da API do Claude.
- O login serve só para a leitura de nota: as listas e o catálogo continuam funcionando sem ele, e
  os dados continuam só no celular. *(1b)*

## Ligação com o catálogo

Cada linha da nota ("LEITE INTEG ITALAC 1L") é um **produto**, que o app liga a um **item** do
catálogo ("leite").

- **Produto já visto antes:** liga direto ao mesmo item, sem perguntar. *(1b)*
- **Produto novo, item provável no catálogo:** o app sugere o item ("LEITE INTEG ITALAC 1L →
  leite?") e eu confirmo com um toque. *(1b)*
- **Produto novo, sem item provável:** o app propõe criar um item com um nome limpo ("Leite"), que
  eu posso editar. É assim que o catálogo cresce. *(1b)*
- **Linha que não interessa** (sacola, taxa): eu marco "ignorar", e o produto fica ignorado nas
  próximas notas. *(1b)*
- A sugestão de item vem de um modelo de linguagem, que recebe a descrição abreviada e a lista de
  itens do catálogo. A ligação confirmada fica gravada, então cada produto só é perguntado uma
  vez. *(1b)*

## Revisão antes de salvar

1. Uma tela mostra todas as linhas da nota com o item ligado a cada uma; itens novos aparecem
   destacados. *(1b)*
   Por quê: o modelo de visão erra mais do que a consulta da SEFAZ erraria.
2. Ao confirmar, o app grava a compra, os preços e os itens novos. *(1b)*
3. Itens da nota que estavam na lista são marcados como comprados sozinhos. *(1b)*

## Notas repetidas

- A chave de acesso da NFC-e (44 dígitos) identifica a nota. Uma nota já lida não é gravada de
  novo; o app avisa e mostra a compra que já existe. *(1b)*
