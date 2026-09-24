# Roadmap — Thorn HTTP

Fork do Requestly HTTP Interceptor, relançado como **Thorn HTTP**: extensão gratuita, local-first, sem conta, sem backend e sem telemetria.

**Decisões**

- Nome: Thorn HTTP (`thorn-http`). Domínio: `thorn-http.dev`.
- Licença: AGPLv3, mantendo o copyright da BrowserStack.
- Grátis. Sem cadastro obrigatório (link opcional de newsletter no futuro).
- Escopo: o interceptor (regras). SessionBear/gravação de sessão, API Client e tudo que depende de backend foram removidos.
- Editor de regras: empacotado na extensão (`app.html`). Hospedar em `app.thorn-http.dev` pode ser reavaliado depois.
- Side panel de gravação de rede: mantido, 100% local ("Record network" no popup + export HAR).
- Navegadores: Chrome, Edge, Firefox. O código do Safari foi mantido, mas não é compilado (desativado).

Legenda: `[x]` feito · `[ ]` pendente · 👤 depende de você (contas, jurídico, design)

---

## Fase 0 — Rebrand ✅

- [x] Nome/descrição da extensão, popup, painel do DevTools, menu de contexto, side panel, texto do widget na página
- [x] Título/manifest da app, header (logo + nome), footer (site + link do código-fonte)
- [x] Textos "Requestly"/"SessionBook" restantes no código alcançável
- [x] `LICENSE`: copyright Thorn HTTP + aviso de modificação e de não-afiliação
- [x] README com atribuição ao Requestly (AGPLv3)
- [x] Ícones placeholder (todos os estados do ícone, favicon, logos da app)
- [ ] 👤 Logo e ícones definitivos (trocar `browser-extension/mv3/resources/images/*`, `app/src/assets/img/brand/*`, `app/public/favicon.png` e regenerar as imagens de `store/`)

## Fase 1 — Cortes ✅

- [x] Rotas/navegação reduzidas a Regras + Settings; importadores sem exigir login
- [x] SessionBear (app + extensão), gravação de sessão (serviço, content script, page script, widgets), upload da sessão de teste
- [x] API Client (app, serviço de requisições da extensão, menu "Run cURL", listener de import de cURL)
- [x] UI de conta/times/billing/pricing/onboarding, assistente de IA, shared lists, seletores de file server, empurrões para o app desktop
- [x] Nuvem: listeners de sync, checagem remota de versão, block screen, usage metrics
- [x] Analytics/tracking: PostHog, flags remotas do GrowthBook (agora padrões locais), auto-load do Stripe, geolocalização, Google Fonts, bot Writesonic, botão de estrelas do GitHub → **zero requisições a terceiros** (coberto por teste e2e)
- [x] Integração BrowserStack (`externally_connectable`, mensagens externas)
- [x] Proxy do app desktop e a permissão `proxy`
- [x] Código inalcançável apagado com base no grafo de módulos do Vite (≈2.600 → ≈700 arquivos em `app/src`)
- [x] Docs do Requestly (`documentation/`), workflows de deploy, CODEOWNERS, configs WhiteSource/DeepSource, zips antigos de release, chaves de dev do Requestly em `app/.env`
- [x] 58 dependências sem uso e 175 assets públicos sem uso (pacote da extensão: 63 MB → 16 MB descompactado, ~5 MB em zip)
- [ ] O SDK do Firebase ainda vai no bundle (estado de auth, alguns slices e módulos de backend continuam alcançáveis). Nunca é configurado com projeto real e não faz requisições; remover de vez exige refatorar o estado de usuário/auth — vale fazer, não bloqueia.
- [ ] Componentes de `features/pricing` ainda alcançáveis via wrappers `PremiumFeature` (sempre liberados); dá para desembrulhar.

## Fase 2 — Local-first ✅

- [x] Regras só em `chrome.storage.local`
- [x] Export (download JSON) / import, inclusive exports do Requestly (regras importadas começam desativadas — comportamento original)
- [x] Sem pedido de login para exportar, fazer upload ou apagar grupos
- [x] Tudo liberado (sem planos/limites, sem selo premium)

## Fase 3 — Editor empacotado ✅

- [x] App compilada no modo `extension` (`app/app.html`, `app/.env.extension`), hash router, copiada para dentro da extensão
- [x] `WEB_URL="extension"` → `chrome-extension://<id>/app.html#`; popup/devtools/widgets abrem o editor empacotado
- [x] `app.html` carrega o `app.cs.js` direto como ponte app ↔ extensão
- [x] CSP: sem scripts remotos, sem `eval` (html-validate carregado sob demanda, ver limitações)
- [x] Links de docs/privacidade/termos/issues do Requestly → `thorn-http.dev` (`/docs`, `/privacy`, `/terms`, `/issues`, `/source`)
- [x] Firefox: gecko id próprio `thorn-http@thorn-http.dev`, sem `update_url` próprio
- [ ] (opcional) Trocar a ponte `postMessage` por chamadas diretas `chrome.runtime`/`chrome.storage`

## Fase 3.1 — Gravação de rede (local) ✅

- [x] "Record network" no popup (grava a página atual numa aba nova com o side panel)
- [x] "Export HAR" no side panel (HAR 1.2)
- [x] Dependência do BrowserStack Live removida

## Fase 4 — Renomes internos ✅

- [x] Pacotes locais → `@thorn-http/*` (`shared`, `core`, `rule-processor`, `analytics-vendors`, pacotes da app e da extensão); metadados dos pacotes
- [x] Docs de desenvolvimento reescritas: `claude.md`, `.cursorrules`, `getting-started.md`, `CONTRIBUTING.md`, README da app, guias da extensão, contato do código de conduta
- [x] Decidido **não** renomear identificadores internos (namespaces `requestly:*`, prefixos `rq-`, `__REQUESTLY__`, chaves de storage): sem impacto para o usuário, e a lib `@requestly/web-sdk` depende de alguns
- Pacotes npm de terceiros publicados pelo Requestly continuam como dependência (todos Apache-2.0/ISC): `@requestly/web-sdk`, `@requestly/alternative-importers`, `@requestly-ui/resource-table`

## Fase 5 — Qualidade ✅

- [x] Suíte e2e local (`cd browser-extension/mv3 && npm run test:e2e`, Playwright + servidor local, sem internet): regra Redirect pelo editor, pausa, export/apagar/import, gravação de rede + HAR, todos os editores renderizam, zero requisições a terceiros, settings visíveis
- [x] Testes originais de regras (`tests/`) adaptados ao editor empacotado (ainda precisam de internet: usam `requestly.tech`/`example.com`)
- [x] CI (GitHub Actions): install, build, e2e, zips das lojas, lint do Firefox
- [x] Bugs encontrados e corrigidos no caminho:
  - abas do app ficavam repassando `CLIENT_PAGE_LOADED` sem parar → service worker inundado e todas as abas travadas (introduzido ao empacotar o editor)
  - a primeira pausa após instalar não desligava as regras (bug do upstream: mudança `CREATED` do storage ignorada)
  - checagens de recurso comparavam com versões do upstream e escondiam recursos na versão 1.x
- [x] Pacotes das lojas gerados e verificados: zip do Chrome passa na suíte e2e; zip do Firefox passa no `web-ext lint` (0 erros)
- [ ] Teste manual no Firefox (`about:debugging` → carregar o zip) — o Playwright não carrega extensões no Firefox
- [ ] Validação de HTML do Insert Script é pulada na extensão (`html-validate` precisa de `new Function`); trocar por uma checagem compatível com a CSP
- [ ] 48 avisos do lint da AMO (`innerHTML`/`Function` dentro de bibliotecas empacotadas) — podem aparecer na revisão do Firefox

## Fase 6 — Lançamento

Pronto no repo:

- [x] Site `site/` (landing, docs, privacidade, termos, redirects) — pode ir direto para Cloudflare Pages/Netlify
- [x] Textos das lojas, justificativas de permissão, declarações de dados, promo tile, screenshots (`store/`)
- [x] Processo de release e `npm run release` (`browser-extension/mv3/release-process.md`)

Depende de você:

- [ ] 👤 Busca de marca "Thorn HTTP" (USPTO classe 9, INPI)
- [ ] 👤 Org/repo no GitHub (ex.: `thorn-http/thorn-http`), push e configurar como `origin`; se a URL for outra, atualizar `site/_redirects` e `repository` nos `package.json`
- [ ] 👤 Publicar `site/` e apontar `thorn-http.dev` para ele (HTTPS é obrigatório em `.dev`)
- [ ] 👤 (opcional) Registrar `thornhttp.com` e redirecionar
- [ ] 👤 Contas de desenvolvedor: Chrome Web Store (US$5), Edge Add-ons, Firefox AMO
- [ ] 👤 Enviar os zips do `npm run release` com o material de `store/`
- [ ] 👤 (opcional) Link de newsletter (serviço externo, sem backend próprio)

## Depois da v1 (ideias)

- [ ] Sync opcional via Google Drive / arquivo do usuário (sem backend próprio)
- [ ] Mais idiomas (`_locales/`)
- [ ] Build do Safari
- [ ] Cadastro/licença opcional, se a adoção justificar
