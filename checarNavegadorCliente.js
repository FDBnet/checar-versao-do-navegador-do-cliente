var checarNavegador = (function() {
    var m = {
        c: [109, 117], f: [115, 119], s: [16, 17.4], o: [95, 103], e: [109, 117],
        sm: [24, 24], b: [1.48, 1.57], v: [5.6, 6.2], d: [7, 7], i: [11, 11],
        a: [109, 117]
    };
    var u = {
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
    
    function g() {
        var n = navigator;
        var ua = n.userAgent;
        var b = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        var t;
    
    if (/trident/i.test(b[1])) {
        t = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { n: 'i', v: parseInt(t[1] || 0, 10) };
    }
    
    if (b[1] === 'Chrome') {
        t = ua.match(/\b(OPR|Edge|Brave|SamsungBrowser)\/(\d+)/);
        if (t) {
            if (t[1] === 'SamsungBrowser') return { n: 'sm', v: parseInt(t[2], 10) };
            return { n: t[1] === 'OPR' ? 'o' : t[1][0].toLowerCase(), v: parseInt(t[2], 10) };
        }
        if (/Android/.test(ua)) return { n: 'a', v: parseInt(b[2], 10) };
    }
    
    b = b[2] ? [b[1], b[2]] : [n.appName, n.appVersion, '-?'];
    if ((t = ua.match(/version\/(\d+)/i))) b.splice(1, 1, t[1]);
    
    return { n: b[0][0].toLowerCase(), v: parseInt(b[1], 10) };
    }
    
    function s(a, k, v) {
        try {
            return a === 'g' ? localStorage.getItem(k) : localStorage.setItem(k, v);
        } catch (e) {
            return null;
        }
    }
    
    function d(msg, w, b) {
        var e = document.getElementById('infos-sobre-cliente');
        if (e) {
            e.textContent = msg + ' Navegador: ' + (b.n === 'sm' ? 'Samsung Internet' : 
                b.n === 'a' ? 'Android Internet' : 
                b.n === 'b' ? 'Brave' : b.n) + ' ' + b.v + '.';
            if (u[b.n]) {
                var a = document.createElement('a');
                a.href = u[b.n];
                a.target = '_blank';
                a.textContent = 'Atualizar.';
                e.appendChild(a);
            }
            e.className = w ? 'warning' : 'info';
        }
    }
    
    return function() {
        var ss = s('g', 'es24s');
        var cv = navigator.userAgent;
        var sv = s('g', 'bv');
    
        if (ss && sv === cv) {
            var ps = JSON.parse(ss);
            if (ps.s === 2) return ps;
        }
    
        var b = g();
        var sp = 0;
        var v = m[b.n];
    
        if (v) {
        sp = b.v >= v[0] ? (b.v >= v[1] ? 2 : 1) : 0;
        }
    
        var r = { s: sp, j: true, f: sp === 2, m: sp >= 1 };
    
        s('s', 'bv', cv);
        s('s', 'es24s', JSON.stringify(r));
    
        if (sp === 0) {
            d("Olá! Notamos que seu navegador de internet está desatualizado, por isso, não podemos permitir o acesso ao sistema com a versão atual. Atualize para continuar. ", true, b);
        } else if (sp === 1) {
            d("Bem-vindo! Seu navegador de internet atende aos requisitos mínimos, mas para aproveitar todos os recursos e ter a melhor experiência possível, recomendamos atualizar para uma versão mais recente. Atualmente, algumas funcionalidades podem ser limitadas.", false, b);
        }
    
        return r;
    };
})();

var suporte = checarNavegador();