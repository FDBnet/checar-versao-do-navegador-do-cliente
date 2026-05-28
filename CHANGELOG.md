# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [3.2.0] — 2026-05-28

Mais navegadores reconhecidos, sem mudança no formato do retorno nem na API existente.

### Adicionado

- **Detecção de cinco navegadores que antes caíam silenciosamente como "Chrome"**
  (recebendo o link de atualização errado), cada um com nome legível, faixa de versão
  e URL próprios:
  - `v` — **Vivaldi** (UA `Vivaldi/`), padrão `[6, 7]`.
  - `y` — **Yandex** (UA `YaBrowser/`), padrão `[23, 24]`.
  - `uc` — **UC Browser** (UA `UCBrowser/`), padrão `[13, 15]`.
  - `w` — **Whale / Naver** (UA `Whale/`), padrão `[3, 3]`.
  - `ddg` — **DuckDuckGo** (UA `DuckDuckGo/`, detectável no Android), padrão `[5, 5]`.
- **7 novos testes** cobrindo a detecção dessas skins e a arbitragem Client Hints ↔ UA
  (49 no total, passando no fonte e no minificado).

### Corrigido

- **Skins de Chromium classificadas como Chrome.** Vivaldi, Yandex, UC Browser, Whale e
  DuckDuckGo não publicam marca própria em Client Hints — aparecem apenas como
  "Google Chrome". Como o Client Hints tinha prioridade absoluta, esses navegadores eram
  identificados como Chrome. Agora, quando o Client Hints revela só "Chrome genérico", o
  user agent é consultado para identificar a skin real (tokens `Vivaldi/`, `YaBrowser/`
  etc.). Navegadores positivamente identificados pelo Client Hints (Edge, Opera, Samsung,
  Brave) continuam tendo prioridade.

### Nota

- As faixas de versão padrão dos novos navegadores são conservadoras e podem ser ajustadas
  por chamada via `versoes`, como qualquer outra entrada da tabela.

## [3.1.0] — 2026-05-28

Melhorias de performance, segurança e funcionalidade, todas retrocompatíveis. Nenhuma
mudança no formato do retorno nem na API existente — código da v3.0 continua funcionando.

### Segurança

- **Allowlist de esquema nas URLs de atualização.** Antes de virar `href` de um link
  (e antes de aparecer em `resultado.navegador.urlAtualizacao`), a URL passa por
  `urlSegura`: só `http:`, `https:`, `mailto:` e `tel:` (ou URLs relativas/âncoras)
  são aceitas. Esquemas perigosos como `javascript:`, `data:` e `vbscript:` viram
  `null` — fechando um vetor de XSS caso `urls` seja configurada a partir de uma
  fonte semi-confiável (CMS, JSON externo). A checagem ignora espaços e caracteres de
  controle, então truques de ofuscação (`"java\tscript:"`, `"  javascript:"`) não escapam.
- **Endurecimento contra prototype pollution no merge de config.** `mesclar`/`clonarRaso`
  agora ignoram as chaves `__proto__`, `constructor` e `prototype` em ambos os níveis,
  protegendo contra config maliciosa parseada de JSON externo.

### Performance

- **Detecção memoizada.** O resultado de `detectar()` é cacheado por referência de
  `navigator` (singleton imutável por realm). Chamadas repetidas de `checarNavegadorCliente`
  (comuns em SPAs) não re-executam as regexes sobre o user agent. `interno.resetarCache()`
  limpa o memo quando necessário (testes, navigator substituído).
- **Tabela de prioridades de Client Hints e regexes pré-compiladas** no escopo do módulo,
  eliminando realocação de array e objetos `RegExp` a cada chamada.

### Adicionado

- **Auto-execução mais cedo.** O aviso agora roda no `DOMContentLoaded` (ou imediatamente,
  se o DOM já estiver pronto quando o script carrega) em vez de esperar o evento `load`,
  que só dispara após imagens e iframes. O `load` permanece como rede de segurança e a
  execução é garantidamente **única**. Resultado: o aviso aparece segundos antes em
  páginas pesadas.
- **Atributos ARIA no aviso** para leitores de tela: `role="alert"` + `aria-live="assertive"`
  para não-suportado (crítico) e `role="status"` + `aria-live="polite"` para desatualizado.
  Desativável com `aria: false`.
- **Callback `aoResultado`** na config: recebe o `Resultado` após a checagem, com erros
  isolados. Conveniência para quem não quer registrar um listener de evento antes do load.
- **`interno.urlSegura` e `interno.resetarCache`** expostos para testes/introspecção.
- **12 novos testes** cobrindo as mudanças acima (42 no total, passando no fonte e no minificado).

## [3.0.0] — 2026-04-18

Reescrita completa com foco em correção, segurança e experiência do desenvolvedor.
Compatibilidade com código chamador da v1 é preservada: os campos `s`, `j`, `f`, `m`
do retorno continuam disponíveis com os mesmos significados.

### Corrigido

- **Edge Chromium não era detectado.** A regex buscava o token `Edge/` enquanto o
  Microsoft Edge (Chromium) expõe `Edg/` no user agent. Edge era classificado
  silenciosamente como Chrome, recebendo URL de atualização errada.
- **Chrome iOS e Firefox iOS eram classificados como Safari.** O user agent em iOS
  contém `Safari/` obrigatoriamente (política do WebKit), e a regex original não
  reconhecia os tokens `CriOS/` e `FxiOS/`.
- **Versões decimais eram truncadas.** Safari 17.0, 17.1, 17.3, 17.4 e 17.5 viravam
  todos `17` via `parseInt`, então Safari 17.4 (alvo padrão) nunca atingia suporte
  completo. Agora usa `parseFloat` e regex que captura a parte decimal.
- **User agents desconhecidos causavam `TypeError`.** Crawlers, apps customizados e
  navegadores não mapeados disparavam `Cannot read properties of undefined (reading 'slice')`.
  Agora degradam para `nivel: 0` graciosamente.
- **Navegadores totalmente atualizados viam o link "Clique para atualizar".** A função
  `avisarCliente` tinha ramos explícitos apenas para nível 0 e 1, mas os `appendChild`
  e `style.visibility` executavam sempre. Agora retorna cedo quando `suportadoCompleto`.
- **`target="_blank"` sem `rel="noopener noreferrer"`** — vulnerabilidade de
  tabnabbing reverso. Particularmente relevante para IE11 (alvo explícito) e
  WebViews antigos.
- **`className = classe` apagava classes existentes** do elemento. Agora usa
  `classList.add` com fallback ES5 para IE.
- **URLs protocol-relative (`//...`)** herdavam HTTP em páginas HTTP. Todas migradas
  para `https://` explícito.
- **Bug de precedência: Samsung Internet, Android WebView e Chrome mobile** eram
  classificados ambiguamente porque a detecção não tinha ordem estrita. Ordem agora
  é explícita e testada: Edge → Opera → Samsung → iOS browsers → Firefox → Chrome/WebView → Safari → IE.
- **Chaves órfãs `d` e `v`** em `versoes` (sem lógica de detecção nem URL) foram removidas.
- **README mencionava armazenamento local** que não existia na v1 — removido.

### Adicionado

- **Configuração parametrizada completa** via argumento da função:
  `versoes`, `urls`, `mensagens`, `elemento`, `classe`, `dispararEvento`,
  `nomeEvento`, `debug`. Deep merge: overrides parciais preservam os defaults
  restantes.
- **Retorno enriquecido** com `navegador.codigo`, `navegador.nome` (legível),
  `navegador.versao`, `navegador.versaoMinima`, `navegador.versaoRecomendada`,
  `navegador.urlAtualizacao`, `deteccao.metodo`, `deteccao.userAgent`,
  `classificacao` (string) e booleans derivados (`suportado`, `suportadoCompleto`,
  `desatualizado`, `naoSuportado`).
- **Detecção via Client Hints** (`navigator.userAgentData.brands`) como caminho
  preferencial no Chromium 90+. Única forma síncrona de distinguir Brave de Chrome.
- **Suporte a novas variantes:** Edge iOS (`EdgiOS`), Edge Android (`EdgA`),
  Opera legado (`Opera/`), MSIE antigo (`MSIE`).
- **Distinção entre Chrome Android e Android WebView** via token `; wv)`.
- **`CustomEvent` `navegador:checado`** disparado na `window` com o resultado
  completo em `event.detail`. Polyfill IE11-safe via `document.createEvent`.
- **Validação de configuração com `TypeError`** explicando exatamente qual chave
  está inválida e o valor recebido. Warning (não erro) quando `minima > recomendada`.
- **Modo `debug`** imprime diagnóstico compacto em `console.info` para facilitar
  troubleshooting em campo.
- **Flag `auto`** (`checarNavegadorCliente.auto = false`) para desativar a
  auto-execução no `load`.
- **`padroes` e `interno`** expostos na função para inspeção e testes unitários.
- **Tipagem via JSDoc `@typedef`** para intellisense completo no VS Code.
- **Suíte de testes** cobrindo 13 navegadores reais, configuração parametrizada,
  comportamento correto e DX (29 testes passando na versão minificada).

### Alterado

- Nome global exportado agora é `checarNavegadorCliente` (antes `checarNavegador` era
  interno, não exportado).
- Mensagens padrão foram limpas (espaços duplos removidos).
- `elemento` aceita seletor CSS (via `querySelector`), `HTMLElement` direto, `null`
  ou `false` (desativa DOM completamente).
- `rel="noopener noreferrer"` adicionado a todos os `target="_blank"`.
- `VERSOES_PADRAO` conservadora (mantida em 2023 para preservar suporte amplo) —
  ajuste via `checarNavegadorCliente({ versoes: { ... } })` conforme política
  de suporte de cada sistema.

### Removido

- Códigos `d` e `v` (placeholders sem implementação) em `VERSOES_PADRAO`.
- Menção falsa a "armazenamento local" no README.
- Minificação manual — `checarNavegadorCliente.min.js` agora é sempre gerado via
  Terser (reprodutível, sem divergência manual).

## [1.x] — 2024

Versão original. Funcional para o caminho feliz (Chrome desktop, Firefox, IE11) mas
com múltiplos bugs silenciosos que a v3 corrige (veja acima). Mantida em histórico.
