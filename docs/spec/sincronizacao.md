# Sincronização

Eu uso o app no celular e no navegador do computador, e os dois mostram os mesmos dados.

- **Entra aqui:** quais aparelhos eu uso, o login, como os dados vão e voltam entre o celular e o
  computador, o que acontece sem internet e quando dois aparelhos mudam a mesma coisa.
- **Não entra aqui:** o backup em arquivo (`backup.md`), o login da leitura de nota
  (`nota-fiscal.md`) e como a sincronização é construída (ADR-007).

## Aparelhos

- Eu uso o app no meu celular Android, instalado pela tela inicial, e no navegador do meu
  computador, pelo mesmo endereço. *(1a)*
- No computador eu vejo e mexo nas listas e no catálogo: adiciono (digitando, pelo catálogo ou em
  lote), edito, risco e apago. *(1a)*
- QR code, modo compra e leitura de nota não precisam funcionar no computador. Onde o
  navegador não tem o recurso, o botão some. *(1a)*
  Por quê: no computador eu planejo; no mercado eu uso o celular.

## Login

- Para sincronizar, eu entro com a minha conta Google; só a minha conta é aceita. *(1a)*
  Por quê: as minhas listas passam a ficar num servidor, e só eu posso lê-las.
- O mesmo login vale para a leitura de nota. *(1b)*
- Sem login, o app abre e funciona com os dados que já estão no aparelho; ele sincroniza quando
  eu entro de novo. *(1a)*

## Como sincroniza

- Os dados ficam no aparelho e numa cópia no servidor. Cada mudança que eu faço vale na hora no
  aparelho e vai para o servidor assim que há internet. *(1a)*
- Quando eu abro o app, volto para ele ou ele recupera a internet, ele traz as mudanças feitas no
  outro aparelho. *(1a)*
- O app mostra, discreto, se há mudanças que ainda não subiram. *(1a)*
- No primeiro login de um aparelho novo, ele baixa tudo do servidor. *(1a)*

## Sem internet

- Sem internet, o app funciona com os dados do aparelho, inclusive no modo compra; as mudanças
  sobem quando a internet volta. *(1a)*
  Por quê: no mercado o sinal costuma ser ruim.

## Conflitos

- Quando eu mudo a mesma coisa nos dois aparelhos antes de eles sincronizarem, vale a última
  mudança. *(1a)*
  Por quê: sou só eu usando, e conflito de verdade é raro; a regra mais simples basta.
- Apagar também é uma mudança: um item que eu apaguei num aparelho some no outro, a não ser que
  eu o tenha mudado depois no outro. *(1a)*
