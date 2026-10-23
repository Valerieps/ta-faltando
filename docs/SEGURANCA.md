# Segurança

As regras que todo código do app segue. Curtas de propósito: as que podem ser testadas são
conferidas pelo `src/security.test.ts`, que roda em todo build.

- **Entra aqui:** as regras de segurança e de privacidade.
- **Não entra aqui:** como cada regra foi implementada (`adr/`) e o que falta verificar (issues
  `t:debito-tecnico` e `t:vulnerability`).

## 1. Rede

O app é local-only na fase 1a e ganha um servidor próprio, só para a leitura de nota, na fase 1b
(ADR-004).

### Fase 1a: local-only

- O app não faz nenhuma chamada de rede: `network-policy.ts` fica vazio e a CSP tem `connect-src 'none'`.
- Os dados ficam só no navegador. Backups vão para arquivos locais que a pessoa escolhe, nunca para um servidor.
- Sem analytics, telemetria nem relatórios de erro remotos.
- Exceção conhecida: o reconhecimento de voz do Chrome manda o áudio para o Google, fora da CSP.
  O microfone só liga quando a pessoa toca no botão (ADR-006).

### Fase 1b: servidor próprio para a nota

- O navegador fala só com a própria origem (`/api`), declarada em `network-policy.ts`; a CSP abre
  `connect-src` só para ela.
- As chamadas de rede do app ficam em `src/infrastructure/`; o resto do código não as faz.
- O servidor não guarda nada: recebe a foto, chama a API do Claude e devolve os dados.
- `/api` só responde a quem entrou com a conta Google da dona (Cloudflare Access, ADR-004).
- A chave da API do Claude fica num segredo do Cloudflare, nunca no código do cliente: tudo que
  está no bundle é público.
- O CPF da nota nunca é gravado: o servidor o descarta antes de responder.

## 2. Para todo app

- Texto do usuário nunca é inserido como HTML (`textContent`, nunca `innerHTML` ou `dangerouslySetInnerHTML`).
- Links abrem com `target="_blank" rel="noopener noreferrer"`.
- Dependências mínimas, com versões exatas, instaladas com `npm ci` e empacotadas no build; nada de CDN.
- A CSP é injetada no build de produção (ADR-002) e os cabeçalhos ficam em `public/_headers`.
- Câmera e microfone só para a própria origem (`Permissions-Policy` em `public/_headers`).
- Nenhum dado pessoal vai para a URL.
