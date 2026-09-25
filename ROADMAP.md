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

- [x] Suíte e2e local com 25 testes (`cd browser-extension/mv3 && npm run test:e2e`, Playwright + servidor local, sem internet). Todas as regras são criadas pela UI e verificadas numa página real: Redirect, Replace, Query Param, headers de request/response, Request Body, Response (fetch + XHR, status code, JS dinâmico, operação GraphQL), Insert Script JS e CSS, Cancel, Delay, User-Agent. Mais: editar regra salva, grupos, lista de bloqueio, templates, export/import, pausa, gravação de rede + HAR, registro de regras executadas, zero requisições a terceiros, settings visíveis
- [x] Testes originais de regras (`tests/`) adaptados ao editor empacotado (ainda precisam de internet: usam `requestly.tech`/`example.com`)
- [x] CI (GitHub Actions): install, build, e2e, zips das lojas, lint do Firefox
- [x] Bugs encontrados e corrigidos no caminho:
  - abas do app ficavam repassando `CLIENT_PAGE_LOADED` sem parar → service worker inundado e todas as abas travadas (introduzido ao empacotar o editor)
  - a primeira pausa após instalar não desligava as regras (bug do upstream: mudança `CREATED` do storage ignorada)
  - checagens de recurso comparavam com versões do upstream e escondiam recursos na versão 1.x
  - o page script de fetch/XHR quebrava ao carregar (`chrome.runtime.getURL` no mundo MAIN): Modify API Response, Modify Request Body e Delay de XHR/fetch não faziam nada (introduzido ao empacotar o editor)
  - `fetch` disparado durante o parse da página escapava da regra de Response (regras ainda não estavam no cache da página)
  - o editor de código perdia o texto digitado logo depois de abrir (formatação assíncrona sobrescrevia) ou logo antes de salvar (debounce)
  - GraphQL não podia ser selecionado ao abrir o editor direto (ex.: pelo popup)
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

## Próximas versões — dores dos usuários

Levantamento de set/2026 (reviews da Chrome Web Store, issues do Requestly no GitHub, comparativos de alternativas). Contexto:

- O Requestly passou a cobrar e as reviews recentes reclamam do paywall ("Ruined with paywall", "Too pricey").
- O ModHeader foi marcado como malware em jul/2026 (coletava domínios visitados) e saiu da loja do Edge: ~1,6 mi de usuários procurando alternativa confiável.
- O Resource Override morreu com o MV3; seus usuários queriam principalmente "mapear arquivo local".
- Reclamações recorrentes: extensão deixa o Chrome lento ou quebra sites (Google Drive, Azure DevOps), e bugs antigos nas regras de corpo.
- Recursos das alternativas que o Thorn ainda não tem (Tweak, Mokku, ModHeader, ModResponse, HTTP Toolkit, Charles, Fiddler) estão distribuídos nas versões abaixo. ⭐ = destaque.

> **Licença ao implementar:** ideias e funcionalidades são livres; **não copiar código** de ferramentas fechadas (Tweak, ModHeader). Código aberto pode ser reaproveitado respeitando a licença (HTTP Toolkit é AGPLv3; Mokku é MIT — manter os avisos). Não clonar a interface nem usar marcas de forma confusa. Todo código novo do Thorn segue AGPLv3.

### v1.1 — Desempenho e compatibilidade

- [ ] **Interceptação de fetch/XHR configurável** (Settings): *Automático* (padrão) / *Sempre* / *Desligado*
  - Automático: o page script só é registrado se houver regra **ativa** de Modify API Response, Modify Request Body ou Delay; entra/sai assim que essas regras mudam
  - Aviso no editor ao salvar uma dessas regras com a interceptação desligada ("esta regra não terá efeito — [Ativar]"); aviso de que abas já abertas precisam de reload
  - Pronto quando: e2e cobrindo os 3 modos; sem regras de corpo, nenhum site recebe o page script; nenhuma regressão na suíte atual
- [ ] **"Não rodar neste site"** no popup: adiciona o domínio da aba atual aos Blocked Sites em um clique (e remove com outro)
- [ ] **Bug herdado:** Modify Request Body não funciona com `application/x-www-form-urlencoded`
- [ ] **Bug herdado:** Modify API Response/Request não funciona em GraphQL via GET (query na URL)
- [ ] **Acessibilidade:** botões e abas sem rótulo para leitores de tela (popup e editor)

### v1.2 — Migração e confiança

- [ ] **Onboarding "Vindo de…"**: na primeira abertura, atalhos para importar do ModHeader, Requestly (JSON), Resource Override, Charles e Header Editor
- [ ] **Perfis no popup**: ligar/desligar grupos direto do popup (o que usuários do ModHeader esperam)
- [ ] **Map Local File na extensão**: enviar/colar um arquivo (JS, CSS, JSON, HTML) guardado localmente e servido no lugar da URL original (hoje só existe no app desktop do Requestly)
- [ ] **Loja e site**: destacar "100% grátis, sem conta, sem coleta de dados, código aberto" e uma comparação honesta com as alternativas
- [ ] ⭐ **Desligar CSP com um clique** (popup, por site): remove a Content-Security-Policy da página atual — hoje só existe como template (ModHeader)
- [ ] **Editor de cookies**: tela própria para editar `Cookie` e `Set-Cookie`, com atributos (SameSite, Secure, HttpOnly, expiração) (ModHeader)

### v1.3 — Mock a partir do tráfego

- [ ] ⭐ **Mock com um clique a partir do tráfego**: botão "Criar mock desta resposta" em cada requisição do **side panel de gravação** e do **painel do DevTools**; gera uma Modify API Response já preenchida com a resposta real, pronta para editar (Mokku)
- [ ] ⭐ **Editar um campo do JSON sem código**: modo "alterar campos" na Modify API Response (ex.: `user.plan` = `"pro"`), aplicado sobre a resposta real — sem colar o JSON inteiro nem escrever JavaScript (HTTP Toolkit "patch JSON")
- [ ] **Procurar e substituir no corpo da resposta** (texto ou regex), sem mock completo (HTTP Toolkit, Charles, Fiddler)
- [ ] **Variáveis e dados fake nos mocks**: variáveis globais (`{{baseUrl}}`) reutilizáveis entre regras e geradores (`{{nome}}`, `{{email}}`, `{{uuid}}`, `{{numero}}`) (Tweak)
- [ ] **Simular timeout / conexão caída**: além de bloquear, deixar a requisição pendurada até o timeout ou falhar no meio (HTTP Toolkit)
- [ ] **Importar HAR → regras**: escolher requisições de um arquivo .har e gerar as regras de mock em lote (primeiro passo do ⭐ Replay de HAR, em *Diferenciais*)
- [ ] **Replace String com várias substituições** na mesma URL

### v1.4 — Debug em tempo real

- [ ] ⭐ **Breakpoints**: pausar uma requisição ou resposta (fetch/XHR) que bate com a regra e editar URL, headers, corpo e status antes de seguir — recurso pago no Tweak e presente em HTTP Toolkit/Charles/Fiddler; nenhuma extensão gratuita oferece
  - Pronto quando: pausa/continua/edita pela UI (DevTools ou janela própria), com timeout de segurança para não travar a página; e2e cobrindo request e response
- [ ] ⭐ **Logpoints**: registrar no console (e no painel do DevTools) requisição e resposta quando batem com a regra, sem alterar nada (Tweak)
- [ ] **Casar regra por header ou corpo da requisição** (além de URL, método, tipo de recurso e página) (HTTP Toolkit)

### v2 — Itens maiores

- [ ] **WebSocket**: ver e alterar mensagens (issue mais votada do interceptor do Requestly)
- [ ] **Regras só na aba atual** e filtros por janela e grupo de abas (via regras de sessão do DNR por aba) (ModHeader)
- [ ] **Regex acima do limite de 2 KB do DNR**: estudar alternativa (dividir em várias regras ou aplicar via page script)
- [ ] **Sync opcional** via Google Drive (sem backend próprio); a sincronia por arquivo/pasta está em *Diferenciais* (regras no repositório)
- [ ] Mais idiomas (`_locales/`) e build do Safari

## Diferenciais — o que ninguém tem

Ideias que nenhuma extensão do segmento (Requestly, Tweak, ModHeader, Mokku) oferece hoje. Todas funcionam sem backend. ⭐ = prioridade.

**Ordem sugerida:** ganho rápido → 1, 3, 9 · diferencial forte → 2, 4, 13 · efeito "uau" em demo → 5, 6, 8.

### Confiança e fluxo

1. [ ] ⭐ **Regras com validade e aviso na página**: timer por regra ("desligar em 1h") e faixa discreta na página ("Thorn está alterando 3 requisições aqui"). Resolve o clássico "esqueci a regra ligada e perdi horas depurando".
2. [ ] ⭐ **Regras versionadas no repositório**: sincronizar as regras com uma pasta local (ex.: `.thorn/rules.json`) via File System Access API. O time compartilha pelo git, sem conta e sem servidor.
3. [ ] ⭐ **Compartilhar regra por link**: a regra vai inteira no fragmento da URL (`thorn-http.dev/r#<base64>`), que nunca chega ao servidor. Quem abre importa com um clique; ótimo para issue, PR e Slack.
9. [ ] ⭐ **"Por que minha regra não aplicou?"**: o teste de regra explica a falha ("host bateu; path não: esperado `/api/v2`, recebido `/api/v1`"). Dor recorrente nas reviews.

### Mocks

4. [ ] ⭐ **Mock com estado (CRUD fake)**: declarar `/api/todos` como coleção; POST adiciona, GET lista, PUT/PATCH atualiza, DELETE remove, tudo guardado no storage da extensão. Dá para fazer o frontend inteiro sem backend pronto (o Mockoon faz isso no desktop; no navegador, ninguém).
11. [ ] **IA local (Gemini Nano do Chrome, Prompt API)**: gerar dados fake realistas a partir de uma resposta de exemplo, ou criar uma regra a partir de uma frase ("mocka o login retornando erro"). Sem backend nem custo; só aparece se o navegador suportar.
13. [ ] ⭐ **Replay de HAR** (evolui o "Importar HAR → regras" da v1.3):
    - **Fontes:** HAR do DevTools, do side panel do Thorn, do Charles, do Proxyman ou do HTTP Toolkit. Formato do LogRocket como bônus: a exportação dele não traz corpos, só status e headers.
    - **Agrupamento:** método + URL (+ `operationName` no GraphQL), com checkbox para escolher o que vira mock.
    - **Modos:** *parcial* (só os endpoints marcados vêm do HAR) e *offline total* (tudo vem do HAR; o resto é bloqueado ou devolve 404).
    - **Sequência:** chamadas repetidas à mesma URL (polling, paginação) devolvem as respostas na ordem gravada. Usa o motor do mock com estado.
    - **Timing opcional:** reaproveitar os tempos do HAR para simular a latência real.
    - **Parâmetros voláteis:** ignorar `_t`, `nonce`, tokens etc. na comparação.
    - **Limites do MV3:** fetch/XHR pelo page script. JS/CSS/imagem/HTML só com `chrome.debugger` (API Fetch), como opção, porque o Chrome mostra a faixa "está sendo depurado". Cookies HttpOnly/Set-Cookie e WebSocket ficam de fora.
    - **Privacidade:** aviso ao importar e opção de remover `Authorization` e `Cookie`.

### Testes e diagnóstico

5. [ ] **Modo caos**: falhas e latência aleatórias por padrão de URL ("10% de `/api/*` com 500, 20% com 2–5 s de atraso") para testar loading, retry e tratamento de erro.
6. [ ] **Detector de mudança de contrato**: aprende o schema das respostas JSON por endpoint e avisa quando um campo some, muda de tipo ou vira `null` ("`/api/user` perdeu `address.zip`").
7. [ ] **Comparar ambientes**: disparar a mesma requisição para produção e staging e mostrar a diferença lado a lado (status, headers, corpo).
8. [ ] **Painel de feature flags**: detectar o tráfego de LaunchDarkly, GrowthBook, Unleash, Optimizely e Split, listar as flags e ligar/desligar cada uma reescrevendo a resposta.
10. [ ] **Ferramentas de JWT**: decodificar o token direto no header e forçar 401 na N-ésima requisição para testar o fluxo de refresh.
12. [ ] **Pacote de reprodução de bug**: exportar regras + HAR num arquivo só. Um colega importa e vê exatamente o mesmo estado. É a parte útil do SessionBear, só que local.
