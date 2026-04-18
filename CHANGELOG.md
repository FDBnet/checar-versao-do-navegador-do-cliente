# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

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
