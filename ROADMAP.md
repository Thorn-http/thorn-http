# Roadmap — Thorn HTTP

Fork do Requestly HTTP Interceptor, relançado como **Thorn HTTP**: extensão gratuita, local-first, sem conta e sem backend.

**Decisões fechadas**

- Nome: Thorn HTTP (`thorn-http`). Domínio: `thorn-http.dev`.
- Licença: AGPLv3, mantendo copyright da BrowserStack.
- Grátis. Sem cadastro obrigatório (só link opcional de newsletter).
- Foco: interceptor (regras). Cortar SessionBear/gravação de sessões, API Client e tudo que depende de backend.
- Editor de regras: **empacotado dentro da extensão** por enquanto (revisitar depois).
- Side panel de gravação de rede: **fica, 100% local**.

Legenda: `[x]` feito · `[ ]` pendente

---

## Fase 0 — Rebrand base

- [x] Nome/descrição da extensão (`browser-extension/mv3/_locales/en/messages.json`)
- [x] Strings visíveis da extensão: popup, devtools, context menu, console, side panel
- [x] Título da app e `app/public/manifest.json`
- [x] `LICENSE`: copyright Thorn HTTP + aviso de modificação e de não-afiliação
- [x] `package.json` raiz: nome, descrição, autor, homepage
- [x] `README.md` novo com atribuição ao Requestly
- [ ] Logo e ícones novos (16/48/128px da extensão, favicon, `app/src/assets/img/brand/`)
- [ ] Trocar strings "Requestly" restantes na UI da app (~200 ocorrências em `app/src`). Fazer **depois** da Fase 1, para não renomear código que será apagado
- [ ] Cor/tema da marca (opcional)

## Fase 1 — Cortes (remover o que não entra na v1)

- [ ] **SessionBear / sessões:** `browser-extension/sessionbear/`, `app/src/src-SessionBear/`, `app/src/features/sessionBook/`, `app/src/views/features/sessions/`, `app/src/backend/sessionRecording/`, gravação no popup (`SessionRecording/`), content script `sessionRecorder.ts`, page scripts `sessionRecorderHelper.js` e `networkBodyRecorder.js`
- [ ] **API Client:** `app/src/features/apiClient/`, `app/src/backend/apiClient/`, popup `ApiClientContainer/`
- [ ] **Conta e times:** auth, workspaces, RBAC, convites (`features/workspaces`, `features/rbac`, `backend/auth`, `backend/workspace`, `backend/user`)
- [ ] **Billing/pricing:** `features/pricing`, `backend/billing`, gates de plano premium (liberar todas as features)
- [ ] **Nuvem:** mocks na nuvem (`backend/mocks`), shared lists (`backend/sharedList`)
- [ ] **AI / requestBot:** `features/ai`, `features/requestBot` (dependem de backend)
- [ ] **Onboarding** atrelado a login (`features/onboarding`, `backend/onboarding`)
- [ ] **Integração com desktop app do Requestly:** popup `DesktopAppProxy/`, telas de desktop na app
- [ ] **Integração BrowserStack:** `externally_connectable` nos manifests e mensagens externas em `messageHandler/listener.ts` (`onMessageExternal`)
- [ ] **Analytics/tracking:** `common/analytics-vendors/`, eventos de analytics na app e extensão
- [ ] **Firebase:** `app/src/firebase.js`, SDK `firebase` nas dependências, `emulator.dockerfile`, script `deploy-beta`
- [ ] **Docs do Requestly:** `documentation/` (254 MB, Mintlify). Apagar e escrever docs próprias enxutas
- [ ] **Diversos:** `eligible-student-domains.md`, `.all-contributorsrc`, `.whitesource`, `.deepsource.toml`, `.hive/`, `docs/superpowers/`, workflows em `.github/` que apontam para infra da Requestly

## Fase 2 — Local-first

- [ ] Regras e grupos salvos só em `chrome.storage.local` (remover caminhos de sync)
- [ ] Import/export de regras em JSON como forma de backup e compartilhamento
- [ ] Remover telas/gates de login; app abre direto nas regras
- [ ] Revisar limites do plano free (quantidade de regras etc.) e remover
- [ ] Mock de resposta funcionando 100% local (regra Response), sem mock server

## Fase 3 — Onde roda a UI (editor de regras)

Hoje o editor de regras é a web app hospedada em `app.requestly.io` (`WEB_URL` em `browser-extension/config/configs/env/*.json`); o popup só abre essa página.

- [x] Decisão: empacotar a UI dentro da extensão (página da extensão, zero hospedagem). Hospedar em `app.thorn-http.dev` fica para reavaliar depois
- [ ] Build da `app/` gerando bundle para dentro da extensão (página `app.html` ou options page) com roteamento por hash
- [ ] Popup/devtools abrindo a página interna (`chrome.runtime.getURL`) no lugar de `WEB_URL`
- [ ] Trocar a ponte app ↔ extensão (content script `app.cs.js` + `postMessage`) por chamadas diretas `chrome.runtime`/`chrome.storage`
- [ ] Ajustar CSP da extensão para o bundle da app (sem scripts remotos, sem `eval`)
- [ ] Atualizar `WEB_URL`, `OTHER_WEB_URLS`, `LANDING_PAGE_BASE_URL`, `SESSIONS_URL`
- [ ] Atualizar `content_scripts.matches` (`*.requestly.io`, `requestly.com`) nos 4 manifests
- [ ] Firefox: novo `browser_specific_settings.gecko.id` (hoje `extension@requestly.in`) e remover `update_url`
- [ ] Trocar links para `requestly.com`, `docs.requestly.com`, `get.requestly.com` por `thorn-http.dev`

## Fase 3.1 — Side panel de gravação de rede (local)

Hoje a gravação só é iniciada por mensagem externa vinda do BrowserStack Live (`START_NETWORK_RECORDING` via `onMessageExternal`), e os dados voltam para a página deles. Sem o BrowserStack, não há como iniciar.

- [ ] Botão "Gravar rede" no popup (ou menu de contexto) chamando `startNetworkRecording` internamente
- [ ] Exportar gravação como arquivo **HAR** (download local) — o `harBuilder.ts` já monta as entradas
- [ ] Remover dependência de `fallbackUrl`/aba de origem do BrowserStack
- [ ] Manter `@requestly/web-sdk` (Apache-2.0, npm) para captura de bodies, ou avaliar substituir

## Fase 4 — Renomes internos

Não quebra nada para o usuário, mas limpa o código. Como não há base de usuários antiga, não precisa migração de dados.

- [ ] Pacotes `@requestly/*` → `@thorn-http/*` (`browser-extension/*/package.json`, `shared/`, `common/`)
- [ ] Namespaces de mensagens (`requestly:client`, etc.) e chaves de storage
- [ ] Prefixos de CSS/elementos customizados (`rq-*`), se valer o esforço
- [ ] `main`/`module` do `package.json` (`requestly-core.*.js`)
- [ ] `repository`/`bugs` nos `package.json` → repo novo no GitHub
- [ ] Arquivos `claude.md`, `.cursorrules`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `getting-started.md`

## Fase 5 — Qualidade e build

- [ ] Build limpo da extensão (Chrome, Edge, Firefox) após os cortes
- [ ] Rodar/ajustar testes (`browser-extension/mv3/tests`, Playwright) e testes da app
- [ ] CI no GitHub Actions: lint, testes, build e zip para as lojas
- [ ] Remover dependências não usadas após os cortes (tamanho do bundle)
- [ ] Revisar permissões do manifest (`browsingData`, `proxy`, `sidePanel`… manter só o necessário — lojas reprovam permissão sobrando)

## Fase 6 — Lançamento

- [ ] Checagem de marca "Thorn HTTP" no USPTO (classe 9) e INPI
- [ ] Org `thorn-http` no GitHub, repo público (exigência da AGPL: código disponível)
- [ ] Registrar `thornhttp.com` e redirecionar para `thorn-http.dev` (opcional)
- [ ] Landing page em `thorn-http.dev` (HTTPS): features, link das lojas, link do código-fonte
- [ ] Política de privacidade: "não coletamos dados" (obrigatória nas lojas)
- [ ] Link opcional de newsletter (serviço externo, ex. Buttondown), sem backend próprio
- [ ] Contas de desenvolvedor: Chrome Web Store (US$5 único), Edge Add-ons (grátis), Firefox AMO (grátis)
- [ ] Listagem nas lojas: nome, descrição, screenshots, ícone, link do código-fonte
- [ ] Safari: fica para depois (exige Apple Developer, US$99/ano)

## Depois da v1 (ideias)

- [ ] Sync opcional via Google Drive/arquivo do usuário (sem backend próprio)
- [ ] Mais idiomas (`_locales/`)
- [ ] Templates de regras prontos
- [ ] Cadastro/licença opcional, se a adoção justificar
