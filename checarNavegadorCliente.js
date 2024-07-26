(function() {
    var checarNavegador = function() {
        var versoes = {
            c: [109, 117], f: [115, 119], s: [16, 17.4], o: [95, 103], e: [109, 117],
            sm: [24, 24], b: [1.48, 1.57], v: [5.6, 6.2], d: [7, 7], i: [11, 11],
            a: [109, 117]
        };

        var urlsAtualizacao = {
            c: '//www.google.com/intl/pt-BR/chrome/update/',
            f: '//support.mozilla.org/pt-BR/topics/install-and-update/firefox',
            s: '//support.apple.com/pt-br/safari',
            o: '//www.opera.com/pt-br/browsers/opera',
            e: '//www.microsoft.com/pt-br/edge',
            i: '//www.microsoft.com/pt-br/download/internet-explorer.aspx',
            sm: '//www.samsung.com/br/apps/samsung-internet/',
            b: '//brave.com/pt-br/download/',
            a: '//play.google.com/store/apps/details?id=com.google.android.webview'
        };

        function detectarNavegador() {
            var ua = navigator.userAgent;
            var match = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            var tem;
            
            if (/trident/i.test(match[1])) {
                tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                return { nome: 'i', versao: parseInt(tem[1] || 0, 10) };
            }

            if (match[1] === 'Chrome') {
                tem = ua.match(/\b(OPR|Edge|Brave|SamsungBrowser)\/(\d+)/);
                if (tem) {
                    if (tem[1] === 'SamsungBrowser') return { nome: 'sm', versao: parseInt(tem[2], 10) };
                    return { nome: tem[1] === 'OPR' ? 'o' : tem[1].slice(0, 1).toLowerCase(), versao: parseInt(tem[2], 10) };
                }
                if (/Android/.test(ua)) return { nome: 'a', versao: parseInt(match[2], 10) };
            }

            var versionMatch = ua.match(/version\/(\d+)/i);
            return { 
                nome: match[1].slice(0, 1).toLowerCase(), 
                versao: parseInt(versionMatch ? versionMatch[1] : match[2], 10) 
            };
        }

        function redirecionarOuAvisar(navegador, suporte) {
            var paginaRedirecionamento = '/navegadores/desatualizado';
            
            if (suporte === 0) {
                window.location.href = paginaRedirecionamento;
            } else if (suporte === 1) {
                var elemento = document.getElementById('infos-ao-cliente');
                if (elemento) {
                    elemento.textContent = "Seu navegador (app) de internet funciona, mas está um pouco desatualizado. Para uma experiência melhor e mais segura, recomendamos atualizá-lo. Isso garantirá que você continue usando este sistema sem problemas no futuro.  ";
                    elemento.className = 'info';
                    elemento.style.visibility = 'visible'
                    
                    var link = document.createElement('a');
                    link.href = urlsAtualizacao[navegador.nome] || '#';
                    link.target = '_blank';
                    link.textContent = ' Clique para Atualizar.';
                    elemento.appendChild(link);
                }
            }
        }

        var navegador = detectarNavegador();
        var versaoRequerida = versoes[navegador.nome];

        if (!versaoRequerida) return { suporte: 0, javascript: true, funcionalidadesCompletas: false, minimo: false };

        var suporte = navegador.versao >= versaoRequerida[0] ? (navegador.versao >= versaoRequerida[1] ? 2 : 1) : 0;

        redirecionarOuAvisar(navegador, suporte);

        return { 
            suporte: suporte, 
            javascript: true, 
            funcionalidadesCompletas: suporte === 2, 
            minimo: suporte >= 1 
        };
    };

    if (window.addEventListener) {
        window.addEventListener('load', function() {
            setTimeout(checarNavegador, 0);
        });
    } else if (window.attachEvent) {
        window.attachEvent('onload', function() {
            setTimeout(checarNavegador, 0);
        });
    }
})();
