# Briefing — Landing page do Thorn HTTP

Resumo do produto para quem (pessoa ou IA) for desenhar a página. Imagens do produto em `images/`.

## O produto
Thorn HTTP é uma extensão de navegador (Chrome, Edge, Firefox), grátis e open source (AGPLv3),
para interceptar e modificar requisições HTTP(S) direto no navegador: redirecionar URLs,
mudar headers, simular respostas de API (mocks), injetar scripts, atrasar requisições e mais.
Tudo roda 100% local: sem conta, sem servidor, sem coleta de dados.

Domínio: thorn-http.dev
Slogan atual: "Free, local-first HTTP interceptor for your browser. No account, no backend, no tracking."

## Público
- Desenvolvedores frontend e full stack (testar sem depender do backend, apontar produção para localhost)
- QA / testadores (simular erros, lentidão e cenários difíceis)
- Quem usava Requestly, ModHeader, Resource Override ou Tweak e quer uma alternativa grátis e confiável

## Por que agora (posicionamento)
- O Requestly passou a cobrar e virou produto de time; usuários reclamam do paywall.
- O ModHeader foi removido das lojas como malware em jul/2026 (~1,6 mi de usuários sem alternativa).
- As alternativas cobram justamente pelo que o Thorn dá de graça (regras ilimitadas, mocks, HAR).
- Thorn: grátis de verdade, local, código aberto, sem conta.

## Funcionalidades

### Regras (o coração do produto)
| Regra | O que faz |
|---|---|
| Redirect | Manda uma URL para outra (ex.: produção → localhost) |
| Replace String | Troca partes da URL (host, caminho, versão da API) |
| Query Param | Adiciona, altera ou remove parâmetros |
| Modify Headers | Adiciona, altera ou remove headers de requisição e resposta |
| Modify API Response | Troca a resposta de uma API (REST e GraphQL), estática ou via JavaScript, com status code |
| Modify Request Body | Altera o corpo enviado por fetch/XHR |
| Insert Script | Injeta JavaScript ou CSS em páginas |
| Cancel Request | Bloqueia requisições |
| Delay | Atrasa requisições em até 10 minutos, tudo local |
| User-Agent | Troca o User-Agent |

### Diferenciais já prontos
- **Mock com um clique a partir do tráfego:** grava a rede, clica em "Mock" numa resposta real e ela vira uma regra pronta para editar.
- **"Por que minha regra não aplicou?":** o botão Test URL explica item por item (maiúsculas, barra final, query string, filtros, tipo de requisição, site bloqueado...).
- **Regras com validade:** desligam sozinhas depois de 15 min, 1 h, 4 h ou 1 dia; um aviso na página mostra quais regras estão ativas.
- **Compartilhar regras por link:** a regra vai dentro do próprio link (depois do #), nada passa por servidor; quem recebe vê uma prévia e importa desligada.
- **Gravação de rede no painel lateral** com exportação em HAR.
- **Painel no DevTools** mostrando quais regras rodaram em cada requisição.
- Grupos de regras, pausar tudo com um clique, lista de sites bloqueados, templates prontos.
- Importa regras do Requestly (JSON), Charles Proxy, ModHeader, Resource Override e Header Editor.

### Privacidade e segurança (argumento forte)
- 100% local: nenhuma requisição sai da extensão; testes automáticos garantem isso a cada versão.
- Sem conta, sem analytics, sem servidor, nem o nosso.
- Permissões sensíveis são opcionais e explicadas antes de pedir (ex.: atrasar scripts/imagens usa o
  debugger do Chrome só com consentimento explícito).
- Código aberto (AGPLv3), auditável.

## Roadmap (pode ter uma seção "Em breve")
Breakpoints (pausar e editar requisições ao vivo), regras versionadas numa pasta do projeto (compartilhar pelo git),
mock com estado (CRUD fake), replay de HAR, modo caos (falhas e latência aleatórias), detector de mudança de contrato de API,
comparar ambientes, painel de feature flags.

## Marca
- Nome: Thorn HTTP (ícone: um espinho, fundo verde)
- Cores do site: fundo escuro #111312, superfície #1a1d1b, verde #2fae6b (destaque #228b54), texto #e8ece9;
  o site também tem tema claro.
- Tom: técnico, direto, honesto, sem exagero; foco em privacidade e liberdade.

## Material disponível
- Imagens do produto em `images/` (2x):
  - `rules-list.png` — lista de regras (com uma regra que se desliga sozinha)
  - `mock-editor.png` — editor de Modify API Response com o JSON do mock
  - `network-panel.png` — painel lateral de gravação de rede, com os botões "Mock"
  - `test-url.png` — "Test URL" explicando por que uma regra não se aplica
  - `popup.png` — popup da extensão na barra do navegador
- 21 vídeos tutoriais curtos (um por feature, legendados em português), fora do repositório

## O que preciso da página (sugestão de seções)
1. Hero: proposta de valor + botões "Install for Chrome", "Install for Firefox", "View source"
2. Três pilares: Grátis de verdade · 100% local · Open source
3. O que dá para fazer (grid das regras, com ícones)
4. Destaques (mock a partir do tráfego, "por que não aplicou?", regras com validade, compartilhar por link), cada um com imagem/vídeo curto
5. Privacidade (o que NÃO fazemos: conta, servidor, coleta)
6. "Vindo do Requestly / ModHeader?" (importação em 1 clique, comparação factual e respeitosa)
7. Em breve (roadmap)
8. FAQ (é grátis mesmo? por que pede essas permissões? funciona offline? Firefox?)
9. Rodapé: código-fonte, reportar problema, privacidade, termos, aviso de que não é afiliado ao Requestly/BrowserStack

## Restrições
- Site estático, sem cookies, sem analytics, sem scripts ou fontes de terceiros (tudo servido localmente).
- Responsivo, rápido, acessível, com tema claro e escuro.
- Não usar logos ou marcas de concorrentes; comparações só em texto factual.
