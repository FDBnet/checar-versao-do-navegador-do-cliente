# Checar Versão do Navegador do Cliente

[![npm version](https://img.shields.io/npm/v/checar-versao-do-navegador-do-cliente.svg)](https://www.npmjs.com/package/checar-versao-do-navegador-do-cliente)
[![CI](https://github.com/FDBnet/checar-versao-do-navegador-do-cliente/actions/workflows/ci.yml/badge.svg)](https://github.com/FDBnet/checar-versao-do-navegador-do-cliente/actions/workflows/ci.yml)
[![Minified size](https://img.shields.io/bundlephobia/min/checar-versao-do-navegador-do-cliente)](https://bundlephobia.com/package/checar-versao-do-navegador-do-cliente)
[![Downloads](https://img.shields.io/npm/dm/checar-versao-do-navegador-do-cliente.svg)](https://www.npmjs.com/package/checar-versao-do-navegador-do-cliente)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Biblioteca JavaScript leve (≈ 13 KB minificada, zero dependências) para detectar o navegador
do cliente, classificar o nível de suporte e avisar o usuário quando for necessário
atualizar. Parametrizável por chamada, com API ergonômica para desenvolvedor e
compatibilidade preservada com IE11.

- **Versão:** 3.3.0
- **Licença:** MIT

## Sumário

- [Novidades da 3.3.0](#novidades-da-330)
- [Novidades da 3.2.0](#novidades-da-320)
- [Novidades da 3.1.0](#novidades-da-310)
- [O que mudou na v3](#o-que-mudou-na-v3)
- [Instalação](#instalação)
- [Uso mínimo](#uso-mínimo)
- [Uso programático](#uso-programático)
- [Uso via bundler (ES modules / CommonJS)](#uso-via-bundler-es-modules--commonjs)
- [Configuração (`Config`)](#configuração-config)
- [Retorno (`Resultado`)](#retorno-resultado)
- [Eventos](#eventos)
- [Navegadores detectados](#navegadores-detectados)
- [Como o suporte é classificado](#como-o-suporte-é-classificado)
- [Segurança](#segurança)
- [Compatibilidade](#compatibilidade)
- [Desenvolvimento](#desenvolvimento)
- [Migrando da v1 para a v3](#migrando-da-v1-para-a-v3)
- [Contribuições](#contribuições)

## Novidades da 3.3.0

Mais cinco navegadores reconhecidos (retrocompatível):

- **Amazon Silk** (`sl`) e **Maxthon** (`mx`) — detectados pela própria versão.
- **QQ Browser** (`qq`), **Baidu** (`bd`) e **360** (`360`) — "skins" multi-variante cuja
  versão própria não reflete a capacidade (variam entre desktop/mobile, ou usam o motor
  **X5** embutido, como o navegador interno do **WeChat**). São classificados pela **versão
  do Chrome embutido**, com limiares **permissivos** de propósito, para não incomodar
  usuários de motores embutidos antigos que não podem atualizar.

Detalhes no [CHANGELOG](CHANGELOG.md).

## Novidades da 3.2.0

Mais navegadores reconhecidos (retrocompatível — o formato do retorno não mudou):

- **Cinco navegadores novos**, que antes caíam silenciosamente como "Chrome" (e recebiam
  o link de atualização errado): **Vivaldi** (`v`), **Yandex** (`y`), **UC Browser**
  (`uc`), **Whale** (`w`) e **DuckDuckGo** (`ddg`). Cada um com nome legível, faixa de
  versão e URL de atualização próprios.
- **Arbitragem Client Hints ↔ User Agent:** essas "skins" de Chromium não publicam marca
  própria em Client Hints (aparecem só como "Google Chrome"). Quando o Client Hints
  revela apenas Chrome genérico, a biblioteca consulta o user agent para identificar a
  skin real — corrigindo uma identificação incorreta que era silenciosa.

Detalhes no [CHANGELOG](CHANGELOG.md).

## Novidades da 3.1.0

Melhorias retrocompatíveis de performance, segurança e funcionalidade (o formato do
retorno e a API existente não mudaram):

- **Aviso mais cedo:** a auto-execução agora roda no `DOMContentLoaded` (ou de imediato,
  se o DOM já estiver pronto), não mais no `load` — que esperava imagens e iframes. Em
  páginas pesadas, o aviso aparece segundos antes. A execução é garantidamente única.
- **Acessibilidade:** o elemento de aviso recebe `role`/`aria-live` (`alert`/`assertive`
  para não-suportado; `status`/`polite` para desatualizado), anunciado por leitores de
  tela. Desative com `aria: false`.
- **Callback `aoResultado`:** receba o `Resultado` direto na config, sem precisar registrar
  um listener de evento antes do load.
- **Segurança — URLs:** as URLs de atualização passam por uma allowlist de esquema
  (`http`/`https`/`mailto`/`tel` ou relativas). `javascript:`, `data:`, `vbscript:` etc.
  são bloqueados (viram `null`), fechando um vetor de XSS quando `urls` vem de fonte
  semi-confiável.
- **Segurança — merge:** `mesclar` ignora `__proto__`/`constructor`/`prototype`, prevenindo
  prototype pollution a partir de config maliciosa.
- **Performance:** detecção memoizada por `navigator` (regex roda uma vez por página) e
  tabelas/regexes pré-compiladas no escopo do módulo.

Detalhes completos no [CHANGELOG](CHANGELOG.md).

## O que mudou na v3

A v3 é uma reescrita completa focada em correção, segurança e experiência do
desenvolvedor. Ela preserva os campos de retorno antigos (`s`, `j`, `f`, `m`), então
código chamador da v1 continua funcionando sem alterações.

Bugs críticos da v1 que a v3 corrige:

- Edge (Chromium) agora é detectado corretamente — antes caía em `Chrome` por causa
  do token `Edg/` (não `Edge/`) no user agent.
- Chrome iOS (`CriOS/`), Firefox iOS (`FxiOS/`) e Edge iOS (`EdgiOS/`) são identificados
  corretamente — antes todos caíam em Safari.
- Safari 17.4 e outras versões decimais são comparadas como decimais — antes
  `parseInt` truncava e impedia atingir suporte completo.
- User agents desconhecidos não quebram mais a execução — a v1 lançava `TypeError`
  em `.slice` sobre `undefined`.
- Usuários com navegador totalmente atualizado não recebem mais o link
  "Clique para atualizar" indevidamente.
- Link de atualização agora tem `rel="noopener noreferrer"` (mitigação de
  tabnabbing reverso).
- URLs usam `https://` explícito.

Novidades de DX:

- Configuração completa por chamada: versões, URLs, mensagens, seletor do elemento,
  classe CSS, nome do evento, debug.
- Retorno enriquecido com nomes legíveis (`'Chrome'` em vez de só `'c'`),
  classificação como string (`'suportado' | 'desatualizado' | 'nao-suportado'`)
  e booleans de conveniência.
- `CustomEvent` disparado na `window` permite integração desacoplada.
- Validação de configuração com `TypeError` explicando exatamente qual chave
  está inválida.
- Tipagem via JSDoc `@typedef` (intellisense automático no VS Code).
- Funções internas expostas em `checarNavegadorCliente.interno` para testes.

## Instalação

### Via npm / yarn / pnpm

```bash
npm install checar-versao-do-navegador-do-cliente
# ou
yarn add checar-versao-do-navegador-do-cliente
# ou
pnpm add checar-versao-do-navegador-do-cliente
```

### Via CDN (unpkg ou jsDelivr)

```html
<!-- unpkg (sempre a última versão major 3) -->
<script src="https://unpkg.com/checar-versao-do-navegador-do-cliente@3/checarNavegadorCliente.min.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/checar-versao-do-navegador-do-cliente@3/checarNavegadorCliente.min.js"></script>
```

### Download direto

Baixe `checarNavegadorCliente.js` ou `checarNavegadorCliente.min.js` e inclua:

```html
<div id="infos-ao-cliente"></div>
<script src="checarNavegadorCliente.js"></script>
```

A biblioteca usa formato UMD — funciona diretamente em `<script>`, `require()` e
`import` sem configuração adicional.

## Uso mínimo

```html
<!doctype html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <title>Meu sistema</title>
    <style>.info { background: #fffbe6; padding: 8px; border: 1px solid #ffe58f; }</style>
</head>
<body>
    <div id="infos-ao-cliente"></div>

    <!-- ... resto da página ... -->

    <script src="checarNavegadorCliente.js"></script>
</body>
</html>
```

Se o navegador do usuário estiver desatualizado ou não suportado, a `<div>` é
preenchida com a mensagem apropriada e um link para atualização. Se estiver
totalmente atualizado, nada acontece.

## Uso programático

```js
// Desliga a auto-execução para controlar o momento
checarNavegadorCliente.auto = false;

// Chama com override parcial
var resultado = checarNavegadorCliente({
    versoes: {
        c: [120, 130],     // Chrome mínimo 120, alvo 130
        f: [120, 128]      // Firefox mínimo 120, alvo 128
    },
    elemento: '#meu-aviso-custom',
    debug: true
});

if (resultado.naoSuportado) {
    // Redirecionar, bloquear, registrar telemetria etc.
}
```

Sem passar argumentos, `checarNavegadorCliente()` usa todos os defaults — útil
para executar manualmente em momentos específicos do ciclo de vida da página.

## Uso via bundler (ES modules / CommonJS)

A biblioteca é UMD, então funciona com qualquer bundler (Webpack, Vite, Rollup,
esbuild, Parcel). Ela detecta o ambiente e usa o mecanismo de export apropriado.

```js
// ES modules
import checarNavegadorCliente from 'checar-versao-do-navegador-do-cliente';

const resultado = checarNavegadorCliente({ debug: true });
if (resultado.naoSuportado) { /* ... */ }
```

```js
// CommonJS
const checarNavegadorCliente = require('checar-versao-do-navegador-do-cliente');

const resultado = checarNavegadorCliente({ debug: true });
```

**Nota sobre SSR (Next.js, Nuxt, Remix etc.):** em ambiente Node sem `window`
nem `navigator`, a função retorna `nivel: 0` e `navegador.codigo: null` graciosamente.
Você pode chamá-la em SSR sem proteção — o resultado será "não suportado" mas não
causará erro. Para só executar no cliente, faça o check usual:

```js
if (typeof window !== 'undefined') {
    const resultado = checarNavegadorCliente();
}
```

## Configuração (`Config`)

Todos os campos são opcionais. O que você passar é mesclado sobre os defaults.

| Campo            | Tipo                                           | Default                 | Descrição |
| ---------------- | ---------------------------------------------- | ----------------------- | --------- |
| `versoes`        | `{ [codigo]: [minima, recomendada] }`          | Ver [Navegadores](#navegadores-detectados) | Override parcial da tabela de versões. Só os códigos que você passar são sobrescritos. Valores aceitam decimais (Safari 17.4, Brave 1.57). |
| `urls`           | `{ [codigo]: string }`                         | URLs oficiais           | Override parcial das URLs de atualização. |
| `mensagens`      | `{ naoSuportado?, desatualizado?, linkAtualizar? }` | Textos em PT-BR    | Override dos textos exibidos ao usuário. |
| `elemento`       | `string \| HTMLElement \| null \| false`       | `'#infos-ao-cliente'`   | Seletor CSS, referência direta ao elemento, ou `null`/`false` para desativar totalmente a manipulação de DOM. |
| `classe`         | `string`                                       | `'info'`                | Classe CSS adicionada ao elemento quando há aviso. |
| `dispararEvento` | `boolean`                                      | `true`                  | Dispara `CustomEvent` na `window`. |
| `nomeEvento`     | `string`                                       | `'navegador:checado'`   | Nome do evento disparado. |
| `debug`          | `boolean`                                      | `false`                 | Imprime diagnóstico em `console.info`. |
| `aria`           | `boolean`                                      | `true`                  | Adiciona `role`/`aria-live` ao aviso para leitores de tela (`alert`/`assertive` quando não-suportado; `status`/`polite` quando desatualizado). |
| `aoResultado`    | `(resultado) => void`                          | —                       | Callback chamado com o `Resultado` após a checagem. Erros são isolados e nunca quebram a página. |

Também disponíveis como propriedades da função:

- `checarNavegadorCliente.auto` — defina `false` antes do DOM ficar pronto (logo após o `<script>`) para pular a auto-execução.
- `checarNavegadorCliente.padroes` — objetos com os defaults (`versoes`, `urls`, `mensagens`, `nomes`, `config`).
- `checarNavegadorCliente.interno` — funções puras para testes (`detectar`, `calcularNivel`, `viaClientHints`, `viaUserAgent`, `urlSegura`, `resetarCache`, etc.).
- `checarNavegadorCliente.versao` — string da versão atual.

## Retorno (`Resultado`)

```js
{
    // Classificação
    nivel: 2,                                 // 0 | 1 | 2
    classificacao: 'suportado',               // 'suportado' | 'desatualizado' | 'nao-suportado'

    // Booleans derivados
    suportado: true,          // nivel >= 1
    suportadoCompleto: true,  // nivel === 2
    desatualizado: false,     // nivel === 1
    naoSuportado: false,      // nivel === 0

    // Navegador detectado
    navegador: {
        codigo: 'c',                          // código curto
        nome: 'Chrome',                       // nome legível humano
        versao: 130,                          // versão detectada
        versaoMinima: 109,                    // mínima da config
        versaoRecomendada: 117,               // alvo da config
        urlAtualizacao: 'https://www.google.com/intl/pt-BR/chrome/update/'
    },

    // Metadados da detecção
    deteccao: {
        metodo: 'client-hints',               // 'client-hints' | 'user-agent' | null
        userAgent: 'Mozilla/5.0 ...'
    },

    // Aliases legados (mesmos valores da v1, para retrocompatibilidade)
    s: 2,    // === nivel
    j: true, // === true (JavaScript habilitado)
    f: true, // === suportadoCompleto
    m: true  // === suportado
}
```

Quando o navegador não é reconhecido (user agent incomum, crawler, etc.), o
retorno é seguro e estruturado:

```js
{
    nivel: 0,
    classificacao: 'nao-suportado',
    suportado: false, suportadoCompleto: false, desatualizado: false, naoSuportado: true,
    navegador: {
        codigo: null, nome: null, versao: 0,
        versaoMinima: null, versaoRecomendada: null, urlAtualizacao: null
    },
    deteccao: { metodo: null, userAgent: '...' },
    s: 0, j: true, f: false, m: false
}
```

## Eventos

O evento `navegador:checado` é disparado na `window` após cada execução (a menos que
você passe `dispararEvento: false`). O objeto `Resultado` completo fica em `event.detail`.

```js
window.addEventListener('navegador:checado', function (e) {
    console.log(e.detail.navegador.nome + ' ' + e.detail.navegador.versao);
    if (e.detail.naoSuportado) {
        mostrarBloqueio();
    }
});
```

Como a auto-execução roda no `DOMContentLoaded`, registre o listener antes desse
momento (no `<head>`, ou antes do `<script>` da biblioteca). Se preferir não depender
da ordem de carregamento, use o callback `aoResultado`, que é chamado na própria chamada:

```js
checarNavegadorCliente({
    aoResultado: function (r) {
        if (r.naoSuportado) mostrarBloqueio();
    }
});
```

## Navegadores detectados

| Código | Navegador            | Método primário | Padrão `[min, recomendada]` |
| :----: | -------------------- | --------------- | :-------------------------: |
| `c`    | Chrome (e Chrome iOS via `CriOS/`) | Client Hints / UA `Chrome\/` | `[109, 117]` |
| `f`    | Firefox (e Firefox iOS via `FxiOS/`) | UA `Firefox\/` / `FxiOS\/` | `[115, 119]` |
| `s`    | Safari               | UA `Version\/` + `Safari\/` | `[16, 17.4]` |
| `o`    | Opera                | UA `OPR\/` / Client Hints | `[95, 103]` |
| `e`    | Edge Chromium (e Edge iOS/Android) | UA `Edg\/` / `EdgiOS\/` / `EdgA\/` / Client Hints | `[109, 117]` |
| `sm`   | Samsung Internet     | UA `SamsungBrowser\/` | `[24, 24]` |
| `b`    | Brave                | Client Hints (UA é idêntico ao Chrome por política de privacidade) | `[1.48, 1.57]` |
| `a`    | Android WebView      | UA `; wv)` com `Chrome\/` | `[109, 117]` |
| `v`    | Vivaldi              | UA `Vivaldi\/` | `[6, 7]` |
| `y`    | Yandex               | UA `YaBrowser\/` | `[23, 24]` |
| `uc`   | UC Browser           | UA `UCBrowser\/` | `[13, 15]` |
| `w`    | Whale (Naver)        | UA `Whale\/` | `[3, 3]` |
| `ddg`  | DuckDuckGo           | UA `DuckDuckGo\/` (Android) | `[5, 5]` |
| `sl`   | Amazon Silk          | UA `Silk\/` | `[90, 100]` |
| `mx`   | Maxthon              | UA `Maxthon\/` | `[6, 7]` |
| `qq`   | QQ Browser           | UA `MQQBrowser\/` / `QQBrowser\/` → versão do Chrome embutido | `[70, 90]` * |
| `bd`   | Baidu                | UA `baiduboxapp\/` / `BaiduBrowser\/` → versão do Chrome embutido | `[70, 90]` * |
| `360`  | 360 Browser          | UA `360SE` / `360EE` → versão do Chrome embutido | `[70, 90]` * |
| `i`    | Internet Explorer    | UA `Trident\/` / `MSIE ` | `[11, 11]` |

`*` QQ, Baidu e 360 são classificados pela **versão do Chrome embutido** (a versão própria
não reflete a capacidade real — variam entre desktop/mobile ou usam o motor X5). A faixa
acima é comparada contra essa versão de engine.

**Nota sobre Brave:** o Brave remove deliberadamente o token "Brave" do user agent.
A detecção só funciona via Client Hints (Chromium 90+). Em navegadores mais antigos,
Brave é identificado como Chrome — o que é seguro, porque o Brave segue o ciclo de
release do Chromium.

**Nota sobre Vivaldi, Yandex, UC Browser, Whale e DuckDuckGo:** são todos baseados em
Chromium e, ao contrário do Brave, não publicam marca própria em Client Hints — aparecem
como "Google Chrome". A detecção usa o token específico do user agent (`Vivaldi/`,
`YaBrowser/` etc.). Quando o Client Hints revela apenas Chrome genérico, a biblioteca
recorre ao user agent para identificar a skin real. O DuckDuckGo só expõe seu token no
Android; no iOS o UA é o do Safari (e é classificado como tal). As faixas de versão
padrão são conservadoras — ajuste via `versoes` conforme sua política de suporte.

## Como o suporte é classificado

Cada navegador tem uma faixa `[minimaAceitavel, recomendada]`:

- `versao >= recomendada` → **suporte completo** (nível 2, `suportado` = true, `suportadoCompleto` = true). Nenhum aviso é exibido.
- `minimaAceitavel <= versao < recomendada` → **desatualizado** (nível 1). Mensagem
  amigável de atualização é exibida.
- `versao < minimaAceitavel` → **não suportado** (nível 0). Mensagem indicando
  incompatibilidade é exibida.
- Navegador não reconhecido ou sem entrada na tabela → **não suportado** (nível 0).

## Segurança

- Nunca usa `innerHTML` — todo texto é inserido via `createTextNode`, imune a XSS
  via atributos textuais.
- **URLs de atualização passam por allowlist de esquema** antes de virar `href`: só
  `http:`, `https:`, `mailto:`, `tel:` ou URLs relativas/âncoras são aceitas. Esquemas
  perigosos (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`…) são bloqueados e
  o link simplesmente não é criado — `resultado.navegador.urlAtualizacao` vira `null`.
  A inspeção ignora espaços e caracteres de controle, então ofuscações como
  `"java\tscript:"` ou `"  javascript:"` também são barradas.
- **Merge de configuração endurecido contra prototype pollution:** as chaves
  `__proto__`, `constructor` e `prototype` são ignoradas, então config maliciosa
  parseada de JSON externo não consegue contaminar `Object.prototype`.
- Todos os links de atualização usam `target="_blank"` com `rel="noopener noreferrer"`,
  mitigando tabnabbing reverso mesmo em IE11 e WebViews antigos.
- URLs de atualização padrão são `https://` explícitos — não herdam HTTP quando a página
  estiver em HTTP.
- A função pode ser chamada várias vezes com segurança: ela limpa os filhos do elemento
  antes de reescrever (idempotente).
- Falhas de DOM, console, evento ou do callback `aoResultado` são isoladas em `try/catch`
  e nunca afetam o retorno.

## Compatibilidade

Código em ES5 estrito, sem dependências. Testado contra user agents reais de:

- Chrome, Firefox, Safari, Opera, Edge Chromium, Brave
- Chrome iOS, Firefox iOS, Edge iOS
- Samsung Internet, Android WebView
- Vivaldi, Yandex, UC Browser, Whale, DuckDuckGo
- Amazon Silk, Maxthon, QQ Browser, Baidu, 360, motor X5 (WeChat)
- Internet Explorer 11
- User agents desconhecidos (crawlers, apps customizados)

## Desenvolvimento

Este projeto usa apenas Node e Terser — sem framework de testes, sem bundler, sem
transpilação. O fonte é ES5 e pode ser executado diretamente.

### Instalar dependências

```bash
npm install
```

Isso instala apenas o Terser (dev dependency) para minificação.

### Scripts disponíveis

```bash
npm test           # Roda a suíte contra o fonte
npm run test:min   # Roda a suíte contra o minificado
npm run build      # Gera checarNavegadorCliente.min.js via Terser
```

`npm run prepublishOnly` encadeia build + test + test:min automaticamente antes
de qualquer publicação no npm, garantindo que a versão minificada sempre passa
pelos mesmos testes do fonte.

### Publicação (npm)

A publicação é automatizada pelo workflow `.github/workflows/publish.yml`, disparado
quando uma **GitHub Release** é publicada. Fluxo:

1. Garanta que a `version` do `package.json` está correta (ex.: `3.3.0`) na `main`.
2. Crie uma Release no GitHub com a tag `vX.Y.Z` (ex.: `v3.3.0`) — a tag precisa bater
   com a versão do `package.json` (o workflow verifica e falha se divergir).
3. O workflow roda `npm publish` (que executa build + test + test:min via `prepublishOnly`)
   e publica com provenance.

**Pré-requisito (uma vez):** adicione o secret `NPM_TOKEN` em
*Settings → Secrets and variables → Actions* — use um token do tipo **Automation** do npm.

Também é possível publicar manualmente: `npm login` e `npm publish` a partir da `main`.

### Estrutura

```
checarNavegadorCliente.js         — Fonte UMD (~36 KB, com JSDoc)
checarNavegadorCliente.min.js     — Minificado via Terser (~13 KB)
tests/suite.js                    — Suíte de testes (zero dependências)
demo.html                         — Página de teste visual manual
README.md  CHANGELOG.md  LICENSE  — Documentação
.github/workflows/ci.yml          — CI: testa em Node 14/18/20/22
.github/workflows/publish.yml     — Publica no npm ao criar uma Release
package.json                      — Publicação npm
```

## Migrando da v1 para a v3

Código da v1 continua funcionando. Se você usa as chaves `s`, `j`, `f`, `m` do
retorno, elas permanecem exatamente como antes.

Ajustes recomendados para aproveitar a v3:

```js
// Antes (v1):
var r = checarNavegador();
if (r.s === 0) bloquear();

// Depois (v3) — mais legível, mesmo efeito:
var r = checarNavegadorCliente();
if (r.naoSuportado) bloquear();
```

Se você customizava o script editando a tabela `versoes` dentro do arquivo, agora
passe pela config:

```js
// Antes (v1): precisava editar o .js
// Depois (v3):
checarNavegadorCliente.auto = false;
window.addEventListener('load', function () {
    checarNavegadorCliente({ versoes: { c: [120, 130] } });
});
```

A chamada global antiga era `checarNavegador` (não exportada). Agora é
`checarNavegadorCliente` (exportada em `window`). Se algum código fazia
`window.checarNavegador`, atualize para `window.checarNavegadorCliente`.

## Contribuições

Issues e pull requests são bem-vindos. Ao contribuir:

- Mantenha a compatibilidade ES5 / IE11. Sem `const`, `let`, `=>`, `async`, template
  literals, spread, `Object.assign` etc.
- Use `Array.isArray` (não `instanceof Array`) para robustez em cross-realm.
- Todo efeito colateral (DOM, evento, console) deve estar isolado em `try/catch`.
- Novos navegadores/variantes devem ser cobertos em `detectar()` na ordem correta
  de especificidade e refletidos em `VERSOES_PADRAO`, `URLS_PADRAO` e `NOMES_LEGIVEIS`.
- Se adicionar campos ao retorno, mantenha os existentes — eles são API pública estável.

## Licença

MIT. Veja `LICENSE` para o texto completo.
