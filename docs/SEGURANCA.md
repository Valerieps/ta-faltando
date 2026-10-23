# Segurança

As regras que todo código do app segue. Curtas de propósito: as que podem ser testadas são
conferidas pelo `src/security.test.ts`, que roda em todo build.

- **Entra aqui:** as regras de segurança e de privacidade.
- **Não entra aqui:** como cada regra foi implementada (`adr/`) e o que falta verificar (issues
  `t:debito-tecnico` e `t:vulnerability`).

## 1. Rede

Desde a fase 1a o app fala com um servidor próprio, na mesma origem, para sincronizar os dados
entre o celular e o computador (ADR-007); na fase 1b o mesmo servidor lê a nota (ADR-004).

- O navegador fala só com a própria origem (`/api`), declarada em `network-policy.ts`; a CSP abre
  `connect-src` só para ela.
- As chamadas de rede do app ficam em `src/infrastructure/`; o resto do código não as faz.
- `/api` só responde a quem entrou com uma das contas Google liberadas (Cloudflare Access,
  ADR-004), e cada conta só lê e grava os próprios dados (ADR-011). O
  app em si abre sem login, porque não traz dados.
- Os dados ficam no IndexedDB do aparelho e no banco D1 do app, que só `/api` lê e escreve; o
  navegador nunca fala com o banco direto.
- Backups vão para arquivos locais que a pessoa escolhe, nunca para um servidor.
- Sem analytics, telemetria nem relatórios de erro remotos.

### Fase 1b: leitura de nota

- A foto não é guardada: o servidor recebe a foto, chama a API do Claude e devolve os dados.
- A chave da API do Claude fica num segredo do Cloudflare, nunca no código do cliente: tudo que
  está no bundle é público.
- O CPF da nota nunca é gravado: o servidor o descarta antes de responder.

## 2. Para todo app

- Texto do usuário nunca é inserido como HTML (`textContent`, nunca `innerHTML` ou `dangerouslySetInnerHTML`).
- Links abrem com `target="_blank" rel="noopener noreferrer"`.
- Dependências mínimas, com versões exatas, instaladas com `npm ci` e empacotadas no build; nada de CDN.
- A CSP é injetada no build de produção (ADR-002) e os cabeçalhos ficam em `public/_headers`.
- Câmera só para a própria origem, microfone desligado (`Permissions-Policy` em `public/_headers`).
- Nenhum dado pessoal vai para a URL.
