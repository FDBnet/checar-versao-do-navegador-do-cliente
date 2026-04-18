/**
 * Suíte de testes do checarNavegadorCliente.
 * Usa apenas APIs built-in do Node (fs, vm, assert) — zero dependências.
 *
 * Uso:
 *   node tests/suite.js         # testa o fonte
 *   node tests/suite.js --min   # testa o minificado
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');

var alvo = process.argv.indexOf('--min') >= 0
    ? 'checarNavegadorCliente.min.js'
    : 'checarNavegadorCliente.js';

var caminho = path.join(__dirname, '..', alvo);
var src = fs.readFileSync(caminho, 'utf8');

console.log('Testando: ' + alvo);
console.log('');

function novoSandbox(ua, uaData, elemExistente) {
    var elementos = {};
    if (elemExistente) {
        elementos['#infos-ao-cliente'] = {
            nodeType: 1, firstChild: null, className: '', style: {}, children: [],
            appendChild: function (n) {
                this.children.push(n);
                if (!this.firstChild) this.firstChild = n;
            },
            removeChild: function () {
                this.firstChild = null;
                this.children = [];
            },
            classList: {
                add: function (c) {
                    var el = elementos['#infos-ao-cliente'];
                    el.className = (el.className + ' ' + c).trim();
                }
            }
        };
    }
    var listeners = [];
    var sb = {
        navigator: { userAgent: ua || '', userAgentData: uaData || null },
        document: {
            getElementById: function (id) { return elementos['#' + id] || null; },
            querySelector: function (sel) { return elementos[sel] || null; },
            createElement: function (tag) {
                return { tag: tag, appendChild: function (n) { this.child = n; }, style: {} };
            },
            createTextNode: function (t) { return { text: t }; },
            createEvent: function () {
                return {
                    initCustomEvent: function (n, _, __, d) {
                        this.type = n;
                        this.detail = d;
                    }
                };
            }
        },
        window: {},
        console: { info: function () {}, warn: function () {} },
        CustomEvent: function (name, opts) {
            this.type = name;
            this.detail = opts && opts.detail;
            return this;
        },
        module: { exports: {} }
    };
    sb.window = sb;
    sb.global = sb;
    sb.self = sb;
    sb.window.dispatchEvent = function (e) {
        for (var i = 0; i < listeners.length; i++) {
            if (listeners[i].t === e.type) listeners[i].fn(e);
        }
    };
    sb.window.addEventListener = function (t, fn) {
        listeners.push({ t: t, fn: fn });
    };
    vm.createContext(sb);
    vm.runInContext(src, sb);
    // UMD: em sandbox com `module`, o export vai para module.exports; sem, para self.checarNavegadorCliente
    if (sb.module && sb.module.exports && typeof sb.module.exports === 'function') {
        sb.checarNavegadorCliente = sb.module.exports;
    }
    sb.__elementos = elementos;
    sb.__listeners = listeners;
    return sb;
}

var passou = 0, falhou = 0;
var falhas = [];

function teste(nome, fn) {
    try {
        fn();
        console.log('  OK   ' + nome);
        passou++;
    } catch (e) {
        console.log('  FAIL ' + nome + ' — ' + e.message);
        falhou++;
        falhas.push({ nome: nome, erro: e.message });
    }
}

function assertEq(a, b, rotulo) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
        throw new Error((rotulo || '') + ' esperado ' + JSON.stringify(b) + ' recebido ' + JSON.stringify(a));
    }
}

function assertTrue(x, r) {
    if (!x) throw new Error((r || '') + ' esperado truthy, recebido ' + x);
}

// =============================================================================

console.log('=== Detecção ===');

teste('Edge Chromium 130 via Edg/', function () {
    var s = novoSandbox('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.56');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'e');
    assertEq(r.navegador.nome, 'Edge');
    assertEq(r.navegador.versao, 130);
    assertEq(r.classificacao, 'suportado');
});

teste('Edge iOS 120 via EdgiOS/', function () {
    var s = novoSandbox('Mozilla/5.0 (iPhone) AppleWebKit/605 EdgiOS/120.0.0.0');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'e');
    assertEq(r.navegador.versao, 120);
});

teste('Chrome iOS (CriOS) vira Chrome, não Safari', function () {
    var s = novoSandbox('Mozilla/5.0 (iPhone) AppleWebKit/605 CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'c');
    assertEq(r.navegador.versao, 120);
});

teste('Firefox iOS (FxiOS) vira Firefox, não Safari', function () {
    var s = novoSandbox('Mozilla/5.0 (iPhone) AppleWebKit/605 FxiOS/120.0 Mobile/15E148 Safari/605.1');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'f');
    assertEq(r.navegador.versao, 120);
});

teste('Safari 17.4 preserva decimal e é suportadoCompleto', function () {
    var s = novoSandbox('Mozilla/5.0 (Macintosh) AppleWebKit/605 Version/17.4 Safari/605.1.15');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 's');
    assertEq(r.navegador.versao, 17.4);
    assertEq(r.suportadoCompleto, true);
});

teste('Safari 17.3 é desatualizado (não completo)', function () {
    var s = novoSandbox('Mozilla/5.0 (Macintosh) AppleWebKit/605 Version/17.3 Safari/605.1.15');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.classificacao, 'desatualizado');
});

teste('Samsung Internet 24', function () {
    var s = novoSandbox('Mozilla/5.0 (Linux; Android 11) AppleWebKit/537 SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'sm');
    assertEq(r.navegador.versao, 24);
});

teste('Opera 101 (OPR/) é desatualizado (versoes.o=[95,103])', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/115.0.0.0 Safari/537 OPR/101.0.0.0');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'o');
    assertEq(r.navegador.versao, 101);
    assertEq(r.classificacao, 'desatualizado');
});

teste('Android WebView via ; wv)', function () {
    var s = novoSandbox('Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537 Version/4.0 Chrome/120.0.0.0 Mobile Safari/537');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'a');
});

teste('Chrome Android (sem wv) vira Chrome, não WebView', function () {
    var s = novoSandbox('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537 Chrome/120.0.0.0 Mobile Safari/537');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'c');
});

teste('IE 11', function () {
    var s = novoSandbox('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'i');
    assertEq(r.navegador.versao, 11);
});

teste('UA desconhecido NÃO crasha e retorna nivel 0', function () {
    var s = novoSandbox('MeuCrawlerCustomizado/1.0');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.nivel, 0);
    assertEq(r.navegador.codigo, null);
    assertEq(r.naoSuportado, true);
});

teste('Client Hints detecta Brave', function () {
    var s = novoSandbox(
        'Mozilla/5.0 AppleWebKit/537 Chrome/130.0.0.0 Safari/537',
        { brands: [
            { brand: 'Chromium', version: '130' },
            { brand: 'Brave', version: '1.71' },
            { brand: 'Not_A Brand', version: '99' }
        ] }
    );
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.navegador.codigo, 'b');
    assertEq(r.deteccao.metodo, 'client-hints');
});

console.log('');
console.log('=== Configuração parametrizada ===');

teste('Override parcial de versões (só c e f)', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/120.0.0.0 Safari/537');
    var r = s.checarNavegadorCliente({
        versoes: { c: [125, 130] },
        elemento: null, dispararEvento: false
    });
    assertEq(r.classificacao, 'nao-suportado');
    var padroes = s.checarNavegadorCliente.padroes.versoes;
    assertEq(padroes.f, [115, 119]);
});

teste('Override de mensagens', function () {
    var s = novoSandbox('Mozilla/5.0 (Macintosh) AppleWebKit/605 Version/15.0 Safari/605.1.15', null, true);
    s.checarNavegadorCliente({
        mensagens: { naoSuportado: 'CUSTOM_NAO_SUPORTADO' },
        dispararEvento: false
    });
    var el = s.__elementos['#infos-ao-cliente'];
    var texto = el.children.map(function (c) { return c.text || ''; }).join('|');
    assertTrue(texto.indexOf('CUSTOM_NAO_SUPORTADO') >= 0, 'mensagem customizada deveria aparecer: ' + texto);
});

teste('elemento: null desativa DOM', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/50.0 Safari/537', null, true);
    s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    var el = s.__elementos['#infos-ao-cliente'];
    assertEq(el.children.length, 0);
});

teste('Config inválida lança TypeError claro', function () {
    var s = novoSandbox('x');
    var erro = null;
    try { s.checarNavegadorCliente({ versoes: { c: [1] }, dispararEvento: false }); }
    catch (e) { erro = e; }
    assertTrue(erro && typeof erro.message === 'string', 'deveria ter lançado');
    assertTrue(erro.message.indexOf("versoes['c']") >= 0, 'mensagem deve citar a chave: ' + erro.message);
});

teste('Config inválida: elemento tipo errado lança', function () {
    var s = novoSandbox('x');
    var erro = null;
    try { s.checarNavegadorCliente({ elemento: 42, dispararEvento: false }); }
    catch (e) { erro = e; }
    assertTrue(erro && erro.message.indexOf('elemento') >= 0);
});

teste('Warning (não erro) quando mínima > recomendada', function () {
    var s = novoSandbox('x');
    var warned = false;
    s.console.warn = function () { warned = true; };
    s.checarNavegadorCliente({ versoes: { c: [130, 110] }, elemento: null, dispararEvento: false });
    assertTrue(warned, 'deveria ter warned');
});

console.log('');
console.log('=== Comportamento correto ===');

teste('Chrome atualizado NÃO mostra link "Atualizar" (bug crítico v1 resolvido)', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/130.0.0.0 Safari/537', null, true);
    var r = s.checarNavegadorCliente({ dispararEvento: false });
    assertEq(r.classificacao, 'suportado');
    var el = s.__elementos['#infos-ao-cliente'];
    assertEq(el.children.length, 0);
});

teste('Link com target=_blank tem rel=noopener noreferrer', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/50.0 Safari/537', null, true);
    s.checarNavegadorCliente({ dispararEvento: false });
    var el = s.__elementos['#infos-ao-cliente'];
    var link = el.children.filter(function (c) { return c.tag === 'a'; })[0];
    assertTrue(link, 'link deveria existir');
    assertEq(link.target, '_blank');
    assertEq(link.rel, 'noopener noreferrer');
});

teste('URLs são https:// (não protocol-relative)', function () {
    var s = novoSandbox('x');
    var urls = s.checarNavegadorCliente.padroes.urls;
    for (var k in urls) {
        assertTrue(urls[k].indexOf('https://') === 0, k + ' deveria ser https: ' + urls[k]);
    }
});

console.log('');
console.log('=== DX ===');

teste('Retorno tem campos legíveis e aliases legados', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/130.0.0.0 Safari/537');
    var r = s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(r.nivel, 2);
    assertEq(r.s, 2);
    assertEq(r.f, true);
    assertEq(r.m, true);
    assertEq(r.suportadoCompleto, true);
    assertEq(r.classificacao, 'suportado');
    assertEq(r.navegador.nome, 'Chrome');
    assertEq(r.navegador.versaoMinima, 109);
    assertEq(r.navegador.versaoRecomendada, 117);
    assertEq(r.navegador.urlAtualizacao, 'https://www.google.com/intl/pt-BR/chrome/update/');
});

teste('CustomEvent é disparado com detail = resultado', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/130.0.0.0 Safari/537');
    var capturado = null;
    s.window.addEventListener('navegador:checado', function (e) { capturado = e.detail; });
    s.checarNavegadorCliente({ elemento: null });
    assertTrue(capturado, 'evento não capturado');
    assertEq(capturado.navegador.nome, 'Chrome');
});

teste('dispararEvento: false não dispara', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/130.0.0.0 Safari/537');
    var capturado = null;
    s.window.addEventListener('navegador:checado', function (e) { capturado = e.detail; });
    s.checarNavegadorCliente({ elemento: null, dispararEvento: false });
    assertEq(capturado, null);
});

teste('auto=false pula auto-execução no load', function () {
    var s = novoSandbox('Mozilla/5.0 AppleWebKit/537 Chrome/50.0 Safari/537', null, true);
    s.checarNavegadorCliente.auto = false;
    var loadListeners = s.__listeners.filter(function (l) { return l.t === 'load'; });
    for (var i = 0; i < loadListeners.length; i++) loadListeners[i].fn();
    var el = s.__elementos['#infos-ao-cliente'];
    assertEq(el.children.length, 0);
});

teste('Internos expostos para teste', function () {
    var s = novoSandbox('x');
    var fn = s.checarNavegadorCliente.interno;
    assertTrue(fn.detectar);
    assertTrue(fn.calcularNivel);
    assertTrue(fn.viaClientHints);
    assertTrue(fn.viaUserAgent);
    assertEq(fn.calcularNivel({ codigo: 'c', versao: 130 }, { c: [100, 120] }), 2);
    assertEq(fn.calcularNivel({ codigo: 'c', versao: 110 }, { c: [100, 120] }), 1);
    assertEq(fn.calcularNivel({ codigo: 'c', versao: 50 }, { c: [100, 120] }), 0);
    assertEq(fn.calcularNivel(null, { c: [100, 120] }), 0);
});

teste('Versão exposta', function () {
    var s = novoSandbox('x');
    assertEq(s.checarNavegadorCliente.versao, '3.0.0');
});

teste('Padrões expostos', function () {
    var s = novoSandbox('x');
    assertTrue(s.checarNavegadorCliente.padroes.versoes.c);
    assertTrue(s.checarNavegadorCliente.padroes.urls.c);
    assertTrue(s.checarNavegadorCliente.padroes.nomes.c === 'Chrome');
});

console.log('');
console.log('=== UMD ===');

teste('UMD: carregável via require (module.exports)', function () {
    // Valida diretamente, fora do sandbox
    delete require.cache[require.resolve(caminho)];
    var modulo = require(caminho);
    if (typeof modulo !== 'function') throw new Error('module.exports deveria ser função, foi ' + typeof modulo);
    if (modulo.versao !== '3.0.0') throw new Error('versão errada: ' + modulo.versao);
});

console.log('');
console.log('=== Resumo ===');
console.log('Passou: ' + passou + ' / Falhou: ' + falhou);

if (falhou > 0) {
    console.log('');
    console.log('Falhas:');
    for (var i = 0; i < falhas.length; i++) {
        console.log('  - ' + falhas[i].nome + ': ' + falhas[i].erro);
    }
    process.exit(1);
}
