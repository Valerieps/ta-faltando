# Glossário

Um termo, um sentido. Estes nomes valem para os textos da interface e para as docs.

- **Entra aqui:** cada termo do app, com uma definição curta e o arquivo de `spec/` que o usa.
- **Não entra aqui:** as regras em si, que ficam em `spec/`. Se uma definição daqui e uma regra
  divergirem, vale o spec, e o termo daqui é corrigido.

- **Contexto:** um lugar onde eu faço compras: Mercado, Hortifrúti, Padaria, Farmácia, Pet shop,
  Lojas online ou um que eu criei. Cada contexto tem a sua lista. (`spec/itens-e-contextos.md`)
- **Lista:** os itens que estão faltando num contexto. Um item sai da lista quando eu finalizo a
  compra em que ele foi marcado. (`spec/itens-e-contextos.md`, `spec/modo-compra.md`)
- **Catálogo:** todos os itens que eu costumo comprar, cada um com o seu contexto padrão. É a base
  do autocompletar e de como o app escolhe o contexto de um item novo. Não é uma lista: um item do
  catálogo só está na lista quando está faltando. (`spec/itens-e-contextos.md`)
- **Item:** algo que eu compro, em nível genérico ("leite"). É o que vai na lista. (`spec/itens-e-contextos.md`)
- **Contexto padrão:** o único contexto de um item, para onde ele vai quando eu o adiciono. (`spec/itens-e-contextos.md`)
- **Sem contexto:** a aba dos itens que ainda não têm contexto padrão. (`spec/itens-e-contextos.md`)
- **Categoria:** o tipo do item (hortifrúti, laticínios, limpeza, higiene…), usado para agrupar a
  lista no modo compra. As categorias são do app; eu não crio as minhas. (`spec/modo-compra.md`)
- **Setup:** as telas do primeiro uso, que montam o catálogo inicial. (`spec/setup.md`)
- **Sugestão:** um item das filas do setup, com contexto e categoria. (`spec/setup.md`)
- **Cápsula:** o botão de uma sugestão no setup, em forma de cápsula. (`spec/setup.md`)
- **Modo compra:** a lista de um contexto em tela cheia, para usar com uma mão dentro da loja. (`spec/modo-compra.md`)
- **Nota (nota fiscal):** a NFC-e de uma compra, lida pela foto e pelo QR code. (`spec/nota-fiscal.md`)
- **Compra:** uma nota lida e gravada, com loja, data e total. (`spec/nota-fiscal.md`)
- **Loja:** onde a compra foi feita, com nome, CNPJ e contexto. (`spec/nota-fiscal.md`)
- **Produto:** uma linha exata da nota ("LEITE INTEG ITALAC 1L"), ligada a um item. O preço é do
  produto, não do item. (`spec/nota-fiscal.md`, `spec/precos.md`)
- **Sincronizar:** levar as mudanças de um aparelho para o servidor e trazer as do outro, para o
  celular e o computador mostrarem os mesmos dados. (`spec/sincronizacao.md`)
- **Último preço:** o preço da compra mais recente entre todos os produtos de um item. (`spec/precos.md`)
