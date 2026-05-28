/*!
 * checarNavegadorCliente — detecção, classificação e aviso de navegador do cliente
 * Versão: 3.1.0
 * Licença: MIT
 *
 * Destaques:
 *   - Detecção correta de Chrome, Firefox, Safari, Opera, Edge (Chromium), Edge legado,
 *     Samsung Internet, Android WebView, Chrome/Firefox/Edge em iOS, Brave (via Client
 *     Hints) e Internet Explorer 11. Sem colisões silenciosas.
 *   - Versões decimais preservadas (Safari 17.4, Brave 1.57 etc.).
 *   - User agents desconhecidos degradam para s=0 sem lançar exceção.
 *   - Tabela de versões, URLs, mensagens, seletor do elemento, classe CSS e disparo de
 *     evento são todos configuráveis por chamada.
 *   - Retorno rico (nomes legíveis, classificação como string, booleans de conveniência)
 *     com aliases legados (s, j, f, m) preservados para retrocompatibilidade.
 *   - Dispara CustomEvent 'navegador:checado' na window para integração desacoplada.
 *   - Modo debug opcional para inspeção em tempo de desenvolvimento.
 *   - Compatibilidade ES5 / IE11 mantida. Sem dependências.
 *
 * Novidades da 3.1.0:
 *   - Performance: detecção memoizada (regex roda uma vez por navegador) e regexes/tabelas
 *     pré-compiladas no escopo do módulo (sem realocação por chamada).
 *   - Segurança: URLs de atualização passam por allowlist de esquema (bloqueia
 *     javascript:, data:, vbscript: etc.); merge endurecido contra prototype pollution.
 *   - Funcionalidade: aviso aparece mais cedo (DOMContentLoaded em vez de load), atributos
 *     ARIA (role/aria-live) para leitores de tela e callback `aoResultado`.
 *
 * Exemplos de uso:
 *
 *   // 1) Uso mínimo: adicione <div id="infos-ao-cliente"></div> e o <script>.
 *   //    Roda automaticamente assim que o DOM fica pronto, com defaults.
 *
 *   // 2) Uso programático com override parcial de versões:
 *   var r = checarNavegadorCliente({
 *       versoes: { c: [120, 130], f: [120, 128] },   // sobrescreve só Chrome e Firefox
 *       elemento: '#meu-aviso-custom',                // outro seletor
 *       debug: true                                   // console.info com diagnóstico
 *   });
 *   if (r.naoSuportado) { ... }
 *
 *   // 3) Desabilitar auto-execução e chamar sob demanda:
 *   checarNavegadorCliente.auto = false;
 *   // ... depois, no momento certo:
 *   var r = checarNavegadorCliente({ elemento: null });  // sem tocar no DOM
 *
 *   // 4) Ouvir o evento (acoplamento fraco):
 *   window.addEventListener('navegador:checado', function (e) {
 *       console.log(e.detail);
 *   });
 *
 *   // 5) Callback direto, sem precisar registrar listener antes do load:
 *   checarNavegadorCliente({ aoResultado: function (r) { if (r.naoSuportado) bloquear(); } });
 */
(function (root, factory) {
    // UMD: compatível com <script> (global), CommonJS/Node (require) e AMD (define).
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.checarNavegadorCliente = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // =========================================================================
    // TIPOS (JSDoc para intellisense no VS Code / Continue)
    // =========================================================================

    /**
     * @typedef {[number, number]} FaixaVersao  [minimaAceitavel, recomendada]
     */

    /**
     * @typedef {Object} NavegadorDetectado
     * @property {string|null} codigo             Código curto ('c','f','s','o','e','i','sm','b','a') ou null.
     * @property {string|null} nome               Nome legível ('Chrome','Firefox'...) ou null.
     * @property {number}      versao             Versão detectada (pode ser decimal). 0 se desconhecido.
     * @property {number|null} versaoMinima       Mínima aceitável conforme config.
     * @property {number|null} versaoRecomendada  Alvo de suporte completo conforme config.
     * @property {string|null} urlAtualizacao     URL oficial para o usuário atualizar.
     */

    /**
     * @typedef {Object} Deteccao
     * @property {'client-hints'|'user-agent'|null} metodo
     * @property {string} userAgent
     */

    /**
     * @typedef {Object} Resultado
     * @property {0|1|2}                               nivel
     * @property {'suportado'|'desatualizado'|'nao-suportado'} classificacao
     * @property {boolean} suportado           nivel >= 1
     * @property {boolean} suportadoCompleto   nivel === 2
     * @property {boolean} desatualizado       nivel === 1
     * @property {boolean} naoSuportado        nivel === 0
     * @property {NavegadorDetectado} navegador
     * @property {Deteccao}           deteccao
     * @property {0|1|2}   s  alias legado de nivel
     * @property {true}    j  alias legado (sempre true)
     * @property {boolean} f  alias legado de suportadoCompleto
     * @property {boolean} m  alias legado de suportado
     */

    /**
     * @typedef {Object} Mensagens
     * @property {string} [naoSuportado]
     * @property {string} [desatualizado]
     * @property {string} [linkAtualizar]
     */

    /**
     * @typedef {Object} Config
     * @property {Object<string, FaixaVersao>} [versoes]      Override parcial da tabela de versões.
     * @property {Object<string, string>}      [urls]         Override parcial de URLs de atualização.
     * @property {Mensagens}                   [mensagens]    Override parcial de textos exibidos.
     * @property {string|HTMLElement|null|false} [elemento]   Seletor CSS, elemento, ou null/false para desativar DOM.
     * @property {string}  [classe]          Classe CSS aplicada ao elemento (default: 'info').
     * @property {boolean} [dispararEvento]  Dispara CustomEvent na window (default: true).
     * @property {string}  [nomeEvento]      Nome do evento (default: 'navegador:checado').
     * @property {boolean} [debug]           Imprime diagnóstico no console (default: false).
     * @property {boolean} [aria]            Adiciona role/aria-live ao aviso para leitores de tela (default: true).
     * @property {function(Resultado):void} [aoResultado]  Callback chamado com o Resultado (erros isolados).
     */

    // =========================================================================
    // CONSTANTES (defaults imutáveis)
    // =========================================================================

    var NOMES_LEGIVEIS = {
        c:  'Chrome',
        f:  'Firefox',
        s:  'Safari',
        o:  'Opera',
        e:  'Edge',
        i:  'Internet Explorer',
        sm: 'Samsung Internet',
        b:  'Brave',
        a:  'Android WebView'
    };

    /** @type {Object<string, FaixaVersao>} */
    var VERSOES_PADRAO = {
        c:  [109,   117],       // Chrome (desktop e Android)
        f:  [115,   119],       // Firefox
        s:  [16,    17.4],      // Safari (decimal)
        o:  [95,    103],       // Opera (OPR)
        e:  [109,   117],       // Edge Chromium (Edg)
        i:  [11,    11],        // Internet Explorer 11
        sm: [24,    24],        // Samsung Internet
        b:  [1.48,  1.57],      // Brave (via Client Hints)
        a:  [109,   117]        // Android WebView (aproximação pelo Chrome embutido)
    };

    var URLS_PADRAO = {
        c:  'https://www.google.com/intl/pt-BR/chrome/update/',
        f:  'https://support.mozilla.org/pt-BR/topics/install-and-update/firefox',
        s:  'https://support.apple.com/pt-br/safari',
        o:  'https://www.opera.com/pt-br/browsers/opera',
        e:  'https://www.microsoft.com/pt-br/edge',
        i:  'https://www.microsoft.com/pt-br/download/internet-explorer.aspx',
        sm: 'https://www.samsung.com/br/apps/samsung-internet/',
        b:  'https://brave.com/pt-br/download/',
        a:  'https://play.google.com/store/apps/details?id=com.google.android.webview'
    };

    var MENSAGENS_PADRAO = {
        naoSuportado:  'Seu navegador (app) de internet não suporta este sistema.',
        desatualizado: 'Seu navegador (app) de internet funciona, mas está um pouco desatualizado. ' +
                       'Para uma experiência melhor e mais segura, recomendamos atualizá-lo.',
        linkAtualizar: 'Clique para atualizar.'
    };

    var CONFIG_PADRAO = {
        versoes:         VERSOES_PADRAO,
        urls:            URLS_PADRAO,
        mensagens:       MENSAGENS_PADRAO,
        elemento:        '#infos-ao-cliente',
        classe:          'info',
        dispararEvento:  true,
        nomeEvento:      'navegador:checado',
        debug:           false,
        aria:            true,
        aoResultado:     null
    };

    // Esquemas de URL permitidos no link de atualização. Bloqueia javascript:, data:,
    // vbscript:, file:, blob: etc. — vetores clássicos de XSS via href.
    var ESQUEMAS_SEGUROS = { http: 1, https: 1, mailto: 1, tel: 1 };

    // Chaves que jamais podem ser copiadas num merge: vetores de prototype pollution.
    var CHAVES_PROIBIDAS = { '__proto__': 1, 'constructor': 1, 'prototype': 1 };

    // =========================================================================
    // UTILITÁRIOS
    // =========================================================================

    function ehObjetoSimples(x) {
        return x !== null && typeof x === 'object' && !ehArray(x);
    }

    function ehArray(x) {
        // Array.isArray é IE9+ e robusto a objetos de outros realms (iframes, workers).
        if (Array.isArray) return Array.isArray(x);
        return Object.prototype.toString.call(x) === '[object Array]';
    }

    function chaveSegura(k) {
        return !Object.prototype.hasOwnProperty.call(CHAVES_PROIBIDAS, k);
    }

    function clonarRaso(obj) {
        if (!ehObjetoSimples(obj)) return obj;
        var r = {};
        for (var k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k) && chaveSegura(k)) r[k] = obj[k];
        }
        return r;
    }

    /**
     * Mescla override sobre padrão com profundidade fixa de 2 níveis, suficiente
     * para a estrutura de Config (top-level + versoes/urls/mensagens). Arrays são
     * sobrescritos integralmente (uma FaixaVersao nunca é mesclada elemento a elemento).
     * Chaves perigosas (__proto__, constructor, prototype) são ignoradas para impedir
     * prototype pollution caso a config venha de uma fonte semi-confiável (JSON externo).
     */
    function mesclar(padrao, override) {
        if (!ehObjetoSimples(override)) return clonarRaso(padrao);
        var resultado = clonarRaso(padrao);
        for (var k in override) {
            if (!Object.prototype.hasOwnProperty.call(override, k) || !chaveSegura(k)) continue;
            var v = override[k];
            if (ehObjetoSimples(v) && ehObjetoSimples(padrao[k])) {
                resultado[k] = clonarRaso(padrao[k]);
                for (var kk in v) {
                    if (Object.prototype.hasOwnProperty.call(v, kk) && chaveSegura(kk)) {
                        resultado[k][kk] = v[kk];
                    }
                }
            } else {
                resultado[k] = v;
            }
        }
        return resultado;
    }

    /**
     * Extrai versão (decimal) via regex. Retorna 0 se não encontrar.
     */
    function extrair(ua, regex) {
        var m = ua.match(regex);
        if (!m || !m[1]) return 0;
        var n = parseFloat(m[1]);
        return isNaN(n) ? 0 : n;
    }

    /**
     * Allowlist de esquema para URLs exibidas como link clicável. Retorna a URL original
     * se for segura (http/https/mailto/tel ou relativa/âncora), ou null se o esquema for
     * perigoso. Remove espaços e caracteres de controle antes de inspecionar o esquema,
     * para que truques do tipo "java\tscript:" ou "  javascript:" não escapem.
     * @param {string} url
     * @returns {string|null}
     */
    function urlSegura(url) {
        if (typeof url !== 'string' || !url) return null;
        var paraEsquema = url.replace(/[\u0000-\u0020\u007F-\u00A0\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
        var m = paraEsquema.match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):/);
        if (!m) return url; // sem esquema → relativa, âncora ou query: segura
        return Object.prototype.hasOwnProperty.call(ESQUEMAS_SEGUROS, m[1].toLowerCase())
            ? url
            : null;
    }

    // =========================================================================
    // VALIDAÇÃO DE CONFIG (falha rápido com mensagem clara)
    // =========================================================================

    function avisar(msg) {
        if (typeof console !== 'undefined' && console && console.warn) console.warn(msg);
    }

    function validarConfig(config) {
        if (!ehObjetoSimples(config.versoes)) {
            throw new TypeError("checarNavegadorCliente: 'versoes' deve ser objeto.");
        }
        for (var k in config.versoes) {
            if (!Object.prototype.hasOwnProperty.call(config.versoes, k)) continue;
            var faixa = config.versoes[k];
            if (!ehArray(faixa) || faixa.length !== 2
                    || typeof faixa[0] !== 'number' || typeof faixa[1] !== 'number'
                    || isNaN(faixa[0]) || isNaN(faixa[1])) {
                throw new TypeError(
                    "checarNavegadorCliente: versoes['" + k + "'] deve ser " +
                    "[minimaAceitavel, recomendada] com 2 numeros. Recebido: " + JSON.stringify(faixa)
                );
            }
            if (faixa[0] > faixa[1]) {
                avisar("checarNavegadorCliente: versoes['" + k + "'] tem minima (" + faixa[0] +
                       ") maior que recomendada (" + faixa[1] + "). Verifique se a intencao e essa.");
            }
        }
        if (!ehObjetoSimples(config.urls)) {
            throw new TypeError("checarNavegadorCliente: 'urls' deve ser objeto.");
        }
        if (!ehObjetoSimples(config.mensagens)) {
            throw new TypeError("checarNavegadorCliente: 'mensagens' deve ser objeto.");
        }
        if (config.elemento !== null && config.elemento !== false
                && typeof config.elemento !== 'string'
                && !(config.elemento && typeof config.elemento === 'object')) {
            throw new TypeError(
                "checarNavegadorCliente: 'elemento' deve ser seletor (string), HTMLElement, null ou false."
            );
        }
        if (config.aoResultado != null && typeof config.aoResultado !== 'function') {
            avisar("checarNavegadorCliente: 'aoResultado' deve ser função; valor ignorado.");
        }
    }

    // =========================================================================
    // DETECÇÃO (puramente lê navigator)
    // =========================================================================

    // Pré-compilada uma vez (não por chamada): ordem do mais específico ao mais genérico.
    var PRIORIDADES_CH = [
        { padrao: /Microsoft Edge/i,   codigo: 'e'  },
        { padrao: /Opera/i,            codigo: 'o'  },
        { padrao: /Samsung Internet/i, codigo: 'sm' },
        { padrao: /Brave/i,            codigo: 'b'  },
        { padrao: /Google Chrome/i,    codigo: 'c'  }
    ];

    /**
     * Tenta Client Hints (Chromium 90+). Única forma síncrona de distinguir Brave/Edge/Opera
     * de Chrome sem heurística de UA. Lê apenas `navigator.userAgentData.brands`
     * (não faz chamada async a getHighEntropyValues).
     * @returns {{codigo:string, versao:number}|null}
     */
    function viaClientHints() {
        if (typeof navigator === 'undefined') return null;
        var uaData = navigator.userAgentData;
        if (!uaData || !uaData.brands || !uaData.brands.length) return null;

        for (var i = 0; i < PRIORIDADES_CH.length; i++) {
            for (var j = 0; j < uaData.brands.length; j++) {
                var marca = uaData.brands[j];
                if (marca && marca.brand && PRIORIDADES_CH[i].padrao.test(marca.brand)) {
                    var v = parseFloat(marca.version);
                    if (!isNaN(v) && v > 0) {
                        return { codigo: PRIORIDADES_CH[i].codigo, versao: v };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Detecção via UA string. Ordem: do mais específico ao mais genérico.
     * Regras críticas de ordem:
     *   - Edg (Chromium Edge) antes de Chrome (UA contém ambos).
     *   - OPR (Opera moderno) antes de Chrome.
     *   - SamsungBrowser antes de Chrome.
     *   - CriOS / FxiOS / EdgiOS antes de Safari (iOS browsers carregam "Safari/" no UA).
     *   - Android WebView ("; wv)") distinto de Chrome Android.
     * @returns {{codigo:string, versao:number}|null}
     */
    function viaUserAgent() {
        if (typeof navigator === 'undefined' || !navigator.userAgent) return null;
        var ua = navigator.userAgent;
        var v;

        // IE 11
        if (/Trident\//.test(ua)) {
            return { codigo: 'i', versao: extrair(ua, /\brv[: ](\d+(?:\.\d+)?)/) || 11 };
        }

        // Edge Chromium e variantes móveis (antes de Chrome)
        if ((v = extrair(ua, /\bEdg\/(\d+(?:\.\d+)?)/)))    return { codigo: 'e', versao: v };
        if ((v = extrair(ua, /\bEdgiOS\/(\d+(?:\.\d+)?)/))) return { codigo: 'e', versao: v };
        if ((v = extrair(ua, /\bEdgA\/(\d+(?:\.\d+)?)/)))   return { codigo: 'e', versao: v };
        // Edge legado (EdgeHTML, <= 18)
        if ((v = extrair(ua, /\bEdge\/(\d+(?:\.\d+)?)/)))   return { codigo: 'e', versao: v };

        // Opera moderno (antes de Chrome)
        if ((v = extrair(ua, /\bOPR\/(\d+(?:\.\d+)?)/))) return { codigo: 'o', versao: v };
        // Opera legado
        if (/\bOpera\//.test(ua)) {
            v = extrair(ua, /\bVersion\/(\d+(?:\.\d+)?)/) || extrair(ua, /\bOpera\/(\d+(?:\.\d+)?)/);
            if (v) return { codigo: 'o', versao: v };
        }

        // Samsung Internet (antes de Chrome)
        if ((v = extrair(ua, /\bSamsungBrowser\/(\d+(?:\.\d+)?)/))) return { codigo: 'sm', versao: v };

        // Navegadores iOS em WebKit (antes de Safari)
        if ((v = extrair(ua, /\bCriOS\/(\d+(?:\.\d+)?)/))) return { codigo: 'c', versao: v };
        if ((v = extrair(ua, /\bFxiOS\/(\d+(?:\.\d+)?)/))) return { codigo: 'f', versao: v };

        // Firefox
        if ((v = extrair(ua, /\bFirefox\/(\d+(?:\.\d+)?)/))) return { codigo: 'f', versao: v };

        // Chrome e Android WebView
        if (/\bChrome\//.test(ua)) {
            v = extrair(ua, /\bChrome\/(\d+(?:\.\d+)?)/);
            if (!v) return null;
            if (/;\s*wv\)/.test(ua)) return { codigo: 'a', versao: v };
            return { codigo: 'c', versao: v };
        }

        // Safari (Version/ carrega o número humano)
        if (/\bSafari\//.test(ua)) {
            v = extrair(ua, /\bVersion\/(\d+(?:\.\d+)?)/);
            if (v) return { codigo: 's', versao: v };
        }

        // IE antigo
        if ((v = extrair(ua, /\bMSIE\s(\d+(?:\.\d+)?)/))) return { codigo: 'i', versao: v };

        return null;
    }

    // Memo da detecção. `navigator` é um singleton imutável por realm, então o
    // resultado só muda se o próprio objeto navigator for trocado (ex.: em testes).
    // Guardar a referência usada torna o cache correto sem invalidação manual.
    var _navCache = null;
    var _detCache = null;
    var _temCache = false;

    /**
     * Combina Client Hints (preferencial) + UA (fallback). Memoizado por `navigator`.
     * @returns {{codigo:string, versao:number, metodo:string}|null}
     */
    function detectar() {
        var nav = (typeof navigator !== 'undefined') ? navigator : null;
        if (_temCache && nav === _navCache) return _detCache;

        var res = null;
        var ch = viaClientHints();
        if (ch) {
            ch.metodo = 'client-hints';
            res = ch;
        } else {
            var ua = viaUserAgent();
            if (ua) { ua.metodo = 'user-agent'; res = ua; }
        }

        _navCache = nav;
        _detCache = res;
        _temCache = true;
        return res;
    }

    /** Limpa o memo da detecção (útil em testes ou se o navigator for substituído). */
    function resetarCache() {
        _navCache = null;
        _detCache = null;
        _temCache = false;
    }

    // =========================================================================
    // AVALIAÇÃO (pura)
    // =========================================================================

    /**
     * 0 não-suportado | 1 mínimo (desatualizado) | 2 completo
     * @param {{codigo:string, versao:number}|null} navegador
     * @param {Object<string, FaixaVersao>} versoes
     * @returns {0|1|2}
     */
    function calcularNivel(navegador, versoes) {
        if (!navegador) return 0;
        var faixa = versoes[navegador.codigo];
        if (!faixa) return 0;
        if (navegador.versao >= faixa[1]) return 2;
        if (navegador.versao >= faixa[0]) return 1;
        return 0;
    }

    /**
     * Monta o objeto Resultado completo. Formato estável — dev pode depender dele.
     * @returns {Resultado}
     */
    function montarResultado(detectado, nivel, config) {
        var codigo = detectado ? detectado.codigo : null;
        var faixa  = codigo ? config.versoes[codigo] : null;
        var navegadorOut = {
            codigo: codigo,
            nome:   codigo ? (NOMES_LEGIVEIS[codigo] || codigo) : null,
            versao: detectado ? detectado.versao : 0,
            versaoMinima:      faixa ? faixa[0] : null,
            versaoRecomendada: faixa ? faixa[1] : null,
            urlAtualizacao:    codigo && config.urls[codigo] ? urlSegura(config.urls[codigo]) : null
        };
        var classificacao = nivel === 2 ? 'suportado'
                          : nivel === 1 ? 'desatualizado'
                          : 'nao-suportado';

        return {
            nivel:              nivel,
            classificacao:      classificacao,
            suportado:          nivel >= 1,
            suportadoCompleto:  nivel === 2,
            desatualizado:      nivel === 1,
            naoSuportado:       nivel === 0,
            navegador:          navegadorOut,
            deteccao: {
                metodo:    detectado ? detectado.metodo : null,
                userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) || ''
            },
            // Aliases legados
            s: nivel,
            j: true,
            f: nivel === 2,
            m: nivel >= 1
        };
    }

    // =========================================================================
    // EFEITOS COLATERAIS (DOM, evento, console)
    // =========================================================================

    function resolverElemento(ref) {
        if (ref === null || ref === false || typeof ref === 'undefined') return null;
        if (typeof ref === 'string') {
            if (typeof document === 'undefined' || !document.querySelector) return null;
            try { return document.querySelector(ref); } catch (_) { return null; }
        }
        if (ref && typeof ref === 'object' && ref.nodeType === 1) return ref; // HTMLElement
        return null;
    }

    function limparFilhos(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function adicionarClasse(el, classe) {
        if (!classe) return;
        if (el.classList && el.classList.add) { el.classList.add(classe); return; }
        var atual = el.className || '';
        var partes = atual.split(/\s+/);
        for (var i = 0; i < partes.length; i++) if (partes[i] === classe) return;
        el.className = (atual ? atual + ' ' : '') + classe;
    }

    /**
     * Atualiza a div de aviso. Silencioso quando suporte é completo.
     * Toda falha é isolada — nunca afeta o retorno da checar().
     */
    function avisarCliente(resultado, config) {
        if (resultado.suportadoCompleto) return;
        var el = resolverElemento(config.elemento);
        if (!el) return;

        var texto = resultado.naoSuportado ? config.mensagens.naoSuportado : config.mensagens.desatualizado;
        if (!texto) return;

        limparFilhos(el);
        el.appendChild(document.createTextNode(texto + ' '));
        adicionarClasse(el, config.classe);
        el.style.visibility = 'visible';

        // Acessibilidade: anuncia o aviso a leitores de tela. 'alert'/'assertive' para
        // não-suportado (crítico), 'status'/'polite' para desatualizado (não interrompe).
        if (config.aria !== false && el.setAttribute) {
            el.setAttribute('role', resultado.naoSuportado ? 'alert' : 'status');
            el.setAttribute('aria-live', resultado.naoSuportado ? 'assertive' : 'polite');
        }

        var url = resultado.navegador.urlAtualizacao;
        if (url) {
            var link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer'; // mitigação de tabnabbing reverso
            link.appendChild(document.createTextNode(config.mensagens.linkAtualizar || 'Clique para atualizar.'));
            el.appendChild(link);
        }
    }

    /**
     * Dispara CustomEvent na window. IE11-safe via fallback initCustomEvent.
     */
    function dispararEvento(nome, detalhe) {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        var evt;
        try {
            evt = new CustomEvent(nome, { detail: detalhe });
        } catch (_) {
            if (!document.createEvent) return;
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(nome, false, false, detalhe);
        }
        window.dispatchEvent(evt);
    }

    function logarDebug(config, resultado) {
        if (!config.debug || typeof console === 'undefined' || !console.info) return;
        try {
            console.info('[checarNavegadorCliente]', {
                metodo:        resultado.deteccao.metodo,
                codigo:        resultado.navegador.codigo,
                nome:          resultado.navegador.nome,
                versao:        resultado.navegador.versao,
                nivel:         resultado.nivel,
                classificacao: resultado.classificacao,
                userAgent:     resultado.deteccao.userAgent
            });
        } catch (_) { /* console pode falhar em ambientes bizarros */ }
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================

    /**
     * Executa a checagem com a config fornecida (merged com defaults).
     * @param {Config} [configUsuario]
     * @returns {Resultado}
     */
    function checar(configUsuario) {
        var config = mesclar(CONFIG_PADRAO, configUsuario || {});
        validarConfig(config); // lança TypeError em config inválida — DX: falha explícita

        var detectado = null;
        try { detectado = detectar(); } catch (_) { detectado = null; }

        var nivel = calcularNivel(detectado, config.versoes);
        var resultado = montarResultado(detectado, nivel, config);

        try { avisarCliente(resultado, config); } catch (_) { /* DOM isolado */ }
        if (config.dispararEvento) {
            try { dispararEvento(config.nomeEvento, resultado); } catch (_) { /* evento isolado */ }
        }
        logarDebug(config, resultado);
        if (typeof config.aoResultado === 'function') {
            try { config.aoResultado(resultado); } catch (_) { /* callback isolado */ }
        }

        return resultado;
    }

    /**
     * Flag que controla a auto-execução quando o DOM fica pronto (DOMContentLoaded).
     * Defina `checarNavegadorCliente.auto = false` logo após o <script> para pular.
     */
    checar.auto = true;

    /**
     * Defaults expostos (somente leitura por convenção). Útil para o dev
     * inspecionar ou clonar antes de sobrescrever partes.
     */
    checar.padroes = {
        versoes:   VERSOES_PADRAO,
        urls:      URLS_PADRAO,
        mensagens: MENSAGENS_PADRAO,
        nomes:     NOMES_LEGIVEIS,
        config:    CONFIG_PADRAO
    };

    /**
     * Funções internas expostas para teste unitário e introspecção.
     * Não faz parte da API pública estável — pode mudar entre minor versions.
     */
    checar.interno = {
        detectar:        detectar,
        viaClientHints:  viaClientHints,
        viaUserAgent:    viaUserAgent,
        calcularNivel:   calcularNivel,
        montarResultado: montarResultado,
        mesclar:         mesclar,
        validarConfig:   validarConfig,
        urlSegura:       urlSegura,
        resetarCache:    resetarCache
    };

    checar.versao = '3.1.0';

    // =========================================================================
    // AUTO-EXECUÇÃO (opt-out via checar.auto = false)
    // Roda assim que o DOM está utilizável (DOMContentLoaded), não no 'load' — este
    // último espera imagens/iframes e atrasava o aviso por segundos. Se o DOM já
    // estiver pronto quando o script roda, dispara no próximo tick (dando chance de
    // definir checar.auto = false logo após o <script>). Executa no máximo uma vez.
    // Noop quando em Node/CommonJS (sem window) — seguro para require/import.
    // =========================================================================

    (function agendarAuto() {
        if (typeof window === 'undefined') return;

        var jaRodou = false;
        var disparar = function () {
            if (jaRodou || !checar.auto) return;
            jaRodou = true;
            try { checar(); } catch (_) { /* auto-execução nunca quebra a página */ }
        };

        var prontoAgora = typeof document !== 'undefined' && document.readyState
            && document.readyState !== 'loading';

        if (prontoAgora) {
            // DOM já interativo/completo: adia 1 tick para respeitar checar.auto tardio.
            if (typeof setTimeout === 'function') setTimeout(disparar, 0);
            else disparar();
            return;
        }

        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('DOMContentLoaded', disparar, false);
            // Rede de segurança: se o DOMContentLoaded não vier, 'load' garante.
            if (window.addEventListener) window.addEventListener('load', disparar, false);
        } else if (window.addEventListener) {
            window.addEventListener('load', disparar, false);
        } else if (window.attachEvent) {
            window.attachEvent('onload', disparar); // IE8: sem DOMContentLoaded
        }
    })();

    // Factory UMD retorna a função pública. O wrapper acima decide como expô-la.
    return checar;
}));
