/* PETeel — runtime do mockup (substitui o dc-runtime do artifact) */
(function () {
  'use strict';

  // ---------- helpers ----------
  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  /* placeholder de foto: usado em todo lugar onde entra imagem real depois.
     `src` (data-photo) vence o padrão listrado quando houver arquivo. */
  function photo(css, label, tone) {
    var wrap = el('div', 'position:relative;overflow:hidden;background:#2C2B22;' + (css || ''));
    var stripe = tone === 'light'
      ? 'repeating-linear-gradient(135deg,#e6e5dd 0 9px,#d8d7cc 9px 18px)'
      : 'repeating-linear-gradient(135deg,#3a382d 0 9px,#2C2B22 9px 18px)';
    var ph = el('div', 'position:absolute;inset:0;background:' + stripe +
      ';display:grid;place-items:center;text-align:center;padding:10px;font:400 11px Roboto,sans-serif;color:' +
      (tone === 'light' ? 'rgba(44,43,34,0.45)' : 'rgba(249,249,249,0.45)') +
      ';transition:transform 400ms ease', label || 'foto');
    ph.setAttribute('data-photo-slot', '');
    wrap.appendChild(ph);
    return wrap;
  }

  function wedge(color) {
    return el('span', 'position:absolute;top:0;right:0;width:44px;height:44px;background:' +
      (color || '#FDEA00') + ';clip-path:polygon(100% 0,100% 100%,0 0)');
  }

  // ---------- style-hover shim ----------
  function wireHovers(scope) {
    (scope || document).querySelectorAll('[style-hover]').forEach(function (node) {
      if (node.dataset.hoverWired) return;
      node.dataset.hoverWired = '1';
      var base = node.getAttribute('style') || '';
      var hover = node.getAttribute('style-hover') || '';
      node.addEventListener('mouseenter', function () { node.setAttribute('style', base + ';' + hover); });
      node.addEventListener('mouseleave', function () { node.setAttribute('style', base); });
    });
  }

  // ---------- scroll reveal ----------
  function setupReveal(scope) {
    var root = scope || document;
    var els = Array.prototype.slice.call(root.querySelectorAll('[data-reveal]'));
    els.forEach(function (e) {
      if (e.dataset.revealed) return;
      e.style.opacity = '0';
      e.style.transform = 'translateY(16px)';
      e.style.transition = 'opacity 480ms ease, transform 480ms ease';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.opacity = '1';
        en.target.style.transform = 'none';
        en.target.dataset.revealed = '1';
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { if (!e.dataset.revealed) io.observe(e); });
  }

  // ---------- router ----------
  function route() {
    var hash = (location.hash || '#/').replace(/^#/, '') || '/';
    var pages = Array.prototype.slice.call(document.querySelectorAll('[data-route]'));
    var match = pages.filter(function (p) { return p.dataset.route === hash; })[0];
    if (!match) match = pages.filter(function (p) { return p.dataset.route === '/'; })[0];
    pages.forEach(function (p) { p.style.display = p === match ? '' : 'none'; });
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var on = a.dataset.nav === hash || (a.dataset.nav !== '/' && hash.indexOf(a.dataset.nav) === 0);
      a.style.color = on ? '#FDEA00' : (a.dataset.nav === '/' ? '#F9F9F9' : 'rgba(249,249,249,0.72)');
    });
    window.scrollTo(0, 0);
    setupReveal(match);
    wireHovers(match);
  }

  function setupMenu() {
    var btn = document.getElementById('nav-menu');
    var panel = document.getElementById('nav-panel');
    if (!btn || !panel || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function () {
      panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { panel.style.display = 'none'; });
    });
  }

  // ---------- blocos de conteúdo ----------
  /* card com foto no topo — usado em projetos internos, entrevistas, labs */
  function photoCard(title, body, tag, tagColor, photoLabel) {
    var c = el('div', 'position:relative;background:#fff;border:2px solid #2C2B22;overflow:hidden;display:flex;flex-direction:column');
    c.appendChild(photo('aspect-ratio:4/3;flex:none;border-bottom:2px solid #2C2B22', photoLabel || 'foto do projeto'));
    var pad = el('div', 'padding:20px 20px 22px');
    if (tag) {
      pad.appendChild(el('span', 'display:inline-block;background:' + (tagColor || '#FDEA00') + ';color:' +
        (tagColor === '#0000F6' ? '#F9F9F9' : '#2C2B22') +
        ';padding:5px 10px;font:900 10.5px/1 "Roboto Condensed",sans-serif;letter-spacing:0.14em;text-transform:uppercase', tag));
    }
    pad.appendChild(el('h3', 'margin-top:12px;font:900 22px/1.05 "Roboto Condensed",sans-serif;text-transform:uppercase', title));
    pad.appendChild(el('p', 'margin-top:9px;font:400 14.5px/1.55 Roboto,sans-serif', body));
    c.appendChild(pad);
    c.appendChild(wedge(tagColor === '#0000F6' ? '#0000F6' : '#FDEA00'));
    return c;
  }

  /* linha com miniatura à esquerda — projetos externos, cursos, seminários */
  function photoRow(left, title, body, href, photoLabel) {
    var r = el(href ? 'a' : 'div',
      'display:grid;grid-template-columns:150px 96px 1fr;gap:20px;padding:18px 0;border-top:2px solid rgba(44,43,34,0.2);text-decoration:none;color:#2C2B22;align-items:start');
    if (href) r.setAttribute('href', href);
    r.appendChild(photo('aspect-ratio:4/3;border:2px solid #2C2B22', photoLabel || 'foto'));
    r.appendChild(el('span', 'font:900 12px/1.4 "Roboto Condensed",sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#0000F6;padding-top:4px', left));
    var box = el('div');
    box.appendChild(el('h3', 'font:900 21px/1.1 "Roboto Condensed",sans-serif;text-transform:uppercase', title));
    box.appendChild(el('p', 'margin-top:7px;max-width:64ch;font:400 14.5px/1.55 Roboto,sans-serif', body));
    r.appendChild(box);
    return r;
  }

  /* linha sem foto — agendas curtas */
  function row(left, title, body, href) {
    var r = el(href ? 'a' : 'div',
      'display:flex;gap:22px;padding:18px 0;border-top:2px solid rgba(44,43,34,0.2);text-decoration:none;color:#2C2B22;align-items:flex-start');
    if (href) r.setAttribute('href', href);
    r.appendChild(el('span', 'flex:none;min-width:96px;font:900 12px/1.4 "Roboto Condensed",sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#0000F6;padding-top:4px', left));
    var box = el('div');
    box.appendChild(el('h3', 'font:900 21px/1.1 "Roboto Condensed",sans-serif;text-transform:uppercase', title));
    box.appendChild(el('p', 'margin-top:7px;max-width:70ch;font:400 14.5px/1.6 Roboto,sans-serif', body));
    r.appendChild(box);
    return r;
  }

  function fillLists() {
    function put(id, nodes) {
      var host = document.getElementById(id);
      if (!host || host.childElementCount) return;
      nodes.forEach(function (n) { host.appendChild(n); });
    }

    put('internal-projects', [
      photoCard('Retro Pong', 'Pong em Arduino Uno com matriz de LEDs e joysticks. Dois modos: individual e em dupla.', 'Concluído', '#FDEA00', 'foto do protótipo'),
      photoCard('Projeto em andamento', 'Proposta, desenvolvimento e resultados de um projeto interno atual.', 'Em curso', '#0000F6', 'foto do protótipo'),
      photoCard('Projeto em andamento', 'Cada projeto ganha página própria com fotos, autores e etapas.', 'Em curso', '#0000F6', 'foto do protótipo')
    ]);

    put('external-projects', [
      photoRow('Laboratório', 'Pesquisa em laboratório da UFSC', 'Petiano vinculado a um laboratório do CTC, com orientação de professor.', null, 'foto do laboratório'),
      photoRow('Empresa', 'Pesquisa em empresa parceira', 'Trabalho desenvolvido dentro de empresa, com acompanhamento do grupo.', null, 'foto da equipe'),
      photoRow('Competição', 'Equipe de competição da UFSC', 'Participação em equipes como projeto de extensão da universidade.', null, 'foto da competição')
    ]);

    put('courses', [
      photoRow('Mar · 18-19', 'Aulões de C', 'Dois encontros de introdução à linguagem C, abertos ao CTC. Certificado pela UFSC.', null, 'foto do curso'),
      photoRow('A definir', 'Curso de eletrônica básica', 'Ministrante, carga horária, local e link de inscrição.', null, 'foto do curso'),
      photoRow('A definir', 'Curso externo convidado', 'Cursos com ministrantes externos trazidos pelo grupo.', null, 'foto do curso')
    ]);

    put('seminars', [
      row('Sex · 12h10', 'Domando o indomável', 'Seminário apresentado por um membro do grupo. Sala divulgada nos stories.'),
      row('Sex · 12h10', 'A história da exploração espacial', 'Tema livre escolhido pelo ministrante, com perguntas ao final.'),
      row('Sex · 12h10', 'Próximo seminário', 'A agenda das próximas semanas entra aqui.')
    ]);

    put('interviews', [
      photoCard('Entrevista 01', 'Trajetória, linha de pesquisa e conselhos para a graduação.', 'Vídeo', '#FDEA00', 'foto do professor'),
      photoCard('Entrevista 02', 'Espaço para nova entrevista: foto, nome e link do vídeo.', 'Vídeo', '#FDEA00', 'foto do professor'),
      photoCard('Entrevista 03', 'Espaço para nova entrevista.', 'Vídeo', '#FDEA00', 'foto do professor')
    ]);

    put('labs', [
      photoCard('Laboratório 01', 'Visita guiada com o professor responsável: linhas de pesquisa e equipamentos.', 'Vídeo', '#FDA000', 'foto do laboratório'),
      photoCard('Laboratório 02', 'Espaço para novo episódio da série.', 'Vídeo', '#FDA000', 'foto do laboratório'),
      photoCard('Laboratório 03', 'Espaço para novo episódio da série.', 'Vídeo', '#FDA000', 'foto do laboratório')
    ]);

    put('episodes', [
      photoRow('Ep. 03', 'Título do episódio', 'Resumo curto e convidados. Player do Spotify na página.', null, 'capa do episódio'),
      photoRow('Ep. 02', 'Título do episódio', 'Resumo curto e convidados.', null, 'capa do episódio'),
      photoRow('Ep. 01', 'Título do episódio', 'Resumo curto e convidados.', null, 'capa do episódio')
    ]);

    put('techweek', [
      photoRow('Dia 1', 'Oficina de abertura', 'Programação a confirmar com o grupo.', null, 'foto do evento'),
      photoRow('Dia 2', 'Palestra técnica', 'Programação a confirmar com o grupo.', null, 'foto do evento'),
      photoRow('Dia 3', 'Encerramento', 'Programação a confirmar com o grupo.', null, 'foto do evento')
    ]);

    put('alumni-list', [
      row('2024', 'Egressos 2024', 'Nomes, ano de formatura e destino (pós-graduação, empresa, exterior).'),
      row('2023', 'Egressos 2023', 'Nomes, ano de formatura e destino.'),
      row('2022', 'Egressos 2022', 'Nomes, ano de formatura e destino.')
    ]);

    // galeria da home — mosaico 4 col: destaque 2x2 + quatro quadrados
    var gal = document.getElementById('home-gallery');
    if (gal && !gal.childElementCount) {
      [['Seminário semanal', '#FDEA00'], ['VMC — visita técnica', '#0000F6'], ['Aulão de C', '#FDA000'],
       ['Laboratório do CTC', '#FDEA00'], ['Tech Week', '#0000F6']].forEach(function (p, i) {
        var box = photo('border:2px solid #2C2B22;' + (i === 0 ? 'grid-column:span 2;grid-row:span 2' : 'aspect-ratio:1/1'), p[0]);
        box.appendChild(wedge(p[1]));
        gal.appendChild(box);
      });
    }

    // edições da VMC com capa
    var vmcHost = document.getElementById('vmc-editions');
    if (vmcHost && !vmcHost.childElementCount) {
      [['VMC XVI', 'CREA-SC'], ['VMC XV', 'edição anterior'], ['VMC XIV', 'edição anterior'],
       ['VMC XIII', 'edição anterior'], ['VMC XII', 'edição anterior']].forEach(function (e) {
        var a = el('a', 'position:relative;display:block;background:#fff;border:2px solid #2C2B22;text-decoration:none;color:#2C2B22;transition:background 150ms,transform 150ms;overflow:hidden');
        a.setAttribute('href', '#/vmc/edicao');
        a.appendChild(photo('aspect-ratio:3/2;border-bottom:2px solid #2C2B22', 'foto da visita'));
        var pad = el('div', 'padding:18px 20px 20px');
        pad.appendChild(el('h3', 'font:900 26px/1 "Roboto Condensed",sans-serif;text-transform:uppercase', e[0]));
        pad.appendChild(el('p', 'margin-top:6px;font:400 14px/1.5 Roboto,sans-serif', e[1]));
        a.appendChild(pad);
        a.appendChild(wedge('#FDEA00'));
        a.addEventListener('mouseenter', function () { a.style.background = '#FDEA00'; a.style.transform = 'translateY(-3px)'; });
        a.addEventListener('mouseleave', function () { a.style.background = '#fff'; a.style.transform = 'none'; });
        vmcHost.appendChild(a);
      });
    }

    // mapa do site
    var map = document.getElementById('sitemap');
    if (map && !map.childElementCount) {
      [['Início', [['/', 'Home']]],
       ['Quem somos', [['/sobre', 'Quem somos'], ['/estrutura-interna', 'Estrutura interna'], ['/membros', 'Nossa equipe'], ['/processo-seletivo', 'Processo seletivo'], ['/ex-petianos', 'Ex-PETianos']]],
       ['Pesquisa', [['/pesquisa', 'Pesquisa'], ['/projetos-internos', 'Projetos internos'], ['/projetos-externos', 'Projetos externos'], ['/estagio-de-ferias', 'Estágios de férias']]],
       ['Ensino', [['/ensino', 'Ensino'], ['/cursos', 'Cursos'], ['/seminarios', 'Seminários'], ['/conheca-seu-professor', 'Conheça seu Professor']]],
       ['Extensão', [['/extensao', 'Extensão'], ['/vmc', 'VMC'], ['/vmc/edicao', 'VMC — página de edição'], ['/powercast', 'POWERCast'], ['/conheca-o-lab', 'Conheça o Laboratório'], ['/saeel', 'SAEEL'], ['/tech-week', 'Tech Week']]],
       ['Florescer', [['/florescer', 'Florescer'], ['/florescer/o-que-e', 'O que é?'], ['/florescer/estrutura-interna', 'Estrutura interna']]]
      ].forEach(function (grp) {
        var col = el('div');
        col.appendChild(el('h3', 'display:inline-block;background:#2C2B22;color:#F9F9F9;padding:8px 16px 10px;font:900 20px/1 "Roboto Condensed",sans-serif;text-transform:uppercase', grp[0]));
        var list = el('div', 'display:flex;flex-direction:column;margin-top:14px');
        grp[1].forEach(function (it) {
          var a = el('a', 'display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-top:1px solid rgba(44,43,34,0.2);text-decoration:none;color:#2C2B22;font:400 15px Roboto,sans-serif');
          a.setAttribute('href', '#' + it[0]);
          a.appendChild(el('span', null, it[1]));
          a.appendChild(el('span', 'font:400 12px "Roboto Condensed",sans-serif;color:rgba(44,43,34,0.5)', it[0]));
          a.addEventListener('mouseenter', function () { a.style.color = '#0000F6'; });
          a.addEventListener('mouseleave', function () { a.style.color = '#2C2B22'; });
          list.appendChild(a);
        });
        col.appendChild(list);
        map.appendChild(col);
      });
    }
  }

  var PEOPLE = [
    ['Tutor(a)', 'Docente EEL'], ['Petiano(a)', 'Coord. de Pesquisa'],
    ['Petiano(a)', 'Coord. de Ensino'], ['Petiano(a)', 'Coord. de Extensão'],
    ['Petiano(a)', 'Comunicação'], ['Petiano(a)', 'Florescer'],
    ['Petiano(a)', 'Projetos internos'], ['Petiano(a)', 'VMC'],
    ['Petiano(a)', 'POWERCast'], ['Petiano(a)', 'SAEEL'],
    ['Petiano(a)', 'Tech Week'], ['Petiano(a)', 'Estágio de férias']
  ];

  function buildTeam(id, count) {
    var grid = document.getElementById(id);
    if (!grid || grid.childElementCount) return;
    PEOPLE.slice(0, count).forEach(function (p) {
      var card = el('div', 'position:relative;aspect-ratio:4/5;overflow:hidden;background:#2C2B22;cursor:pointer;border:2px solid #2C2B22');
      var ph = el('div', 'position:absolute;inset:0;background:repeating-linear-gradient(135deg,#3a382d 0 9px,#2C2B22 9px 18px);display:grid;place-items:center;font:400 11px Roboto,sans-serif;color:rgba(249,249,249,0.45);transition:transform 400ms ease', 'foto');
      ph.setAttribute('data-photo-slot', '');
      var veil = el('div', 'position:absolute;inset:0;background:#FDEA00;opacity:0;transition:opacity 150ms;display:flex;flex-direction:column;justify-content:flex-end;padding:14px');
      veil.appendChild(el('div', 'font:900 18px/1 "Roboto Condensed",sans-serif;text-transform:uppercase;color:#2C2B22', p[0]));
      veil.appendChild(el('div', 'margin-top:6px;font:700 11px/1.2 "Roboto Condensed",sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#2C2B22', p[1]));
      card.appendChild(ph); card.appendChild(wedge('#FDEA00')); card.appendChild(veil);
      card.addEventListener('mouseenter', function () { veil.style.opacity = '1'; ph.style.transform = 'scale(1.03)'; });
      card.addEventListener('mouseleave', function () { veil.style.opacity = '0'; ph.style.transform = 'scale(1)'; });
      grid.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    fillLists();
    buildTeam('team-grid-home', 5);
    buildTeam('team-grid-full', 12);
    wireHovers(document);
    window.addEventListener('hashchange', route);
    route();
  });
})();

/* ============================================================
   FAIXA — protótipo do bloco editável.
   Uma faixa = fundo + decoração (raio) + N quadrantes de conteúdo.
   As duas bandas do site (Florescer e Processo seletivo) são a
   mesma faixa com parâmetros diferentes.
   ============================================================ */
(function () {
  'use strict';

  var PALETA = {
    amarelo: '#FDEA00', escuro: '#2C2B22', offwhite: '#F9F9F9',
    azul: '#0000F6', laranja: '#FDA000', branco: '#FFFFFF'
  };
  var RAIO = 'polygon(58% 0,0 58%,42% 58%,30% 100%,100% 38%,52% 38%)';
  var LARGURA_RAIO = { pequeno: 140, medio: 220, gigante: 340 };
  var COLUNAS = {
    '1': '1fr', '2': '1.05fr 0.95fr', '2-60/40': '1.4fr 1fr',
    '3': 'repeat(3,1fr)', '2x2': 'repeat(2,1fr)'
  };

  function cor(v) { return PALETA[v] || v || '#2C2B22'; }

  /* o texto não é escolhido pelo editor: deriva do fundo, senão
     alguém acaba pondo amarelo sobre amarelo */
  function claro(fundo) {
    var h = cor(fundo).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
  }

  function n(tag, css, txt) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // ---- elementos que podem entrar num quadrante ----
  var ELEMENTOS = {
    chip: function (el, ctx) {
      var c = cor(el.cor || (ctx.escuro ? 'amarelo' : 'escuro'));
      var solido = el.estilo !== 'contorno';
      return n('span', 'display:inline-block;' +
        (solido ? 'background:' + c + ';color:' + (claro(c) ? '#F9F9F9' : '#2C2B22') + ';'
                : 'border:2px solid ' + c + ';color:' + c + ';') +
        'padding:6px 12px;font:900 11px/1 "Roboto Condensed",sans-serif;letter-spacing:0.16em;text-transform:uppercase' +
        (el.inclinado ? ';transform:rotate(-1.4deg)' : ''), el.texto);
    },
    titulo: function (el, ctx) {
      var tam = { p: '26px', m: '34px', g: 'clamp(30px,3.6vw,48px)' }[el.tamanho || 'g'];
      return n('h2', 'margin-top:16px;font-size:' + tam + ';line-height:1;text-transform:uppercase;max-width:16ch;color:' +
        (ctx.escuro ? '#F9F9F9' : '#2C2B22'), el.texto);
    },
    paragrafo: function (el, ctx) {
      return n('p', 'margin-top:14px;max-width:52ch;font:400 16px/1.6 Roboto,sans-serif;color:' +
        (ctx.escuro ? 'rgba(249,249,249,0.82)' : '#2C2B22'), el.texto);
    },
    botoes: function (el, ctx) {
      var box = n('div', 'display:flex;gap:12px;margin-top:24px;flex-wrap:wrap');
      (el.itens || []).forEach(function (b) {
        var acc = cor(b.cor || ctx.acento);
        var a = n('a', b.variante === 'contorno'
          ? 'border:2px solid ' + (ctx.escuro ? '#F9F9F9' : '#2C2B22') + ';color:' + (ctx.escuro ? '#F9F9F9' : '#2C2B22') +
            ';padding:13px 24px;font:900 13px/1 "Roboto Condensed",sans-serif;letter-spacing:0.12em;text-transform:uppercase'
          : 'background:' + acc + ';color:' + (claro(acc) ? '#F9F9F9' : '#2C2B22') +
            ';padding:15px 26px;font:900 13px/1 "Roboto Condensed",sans-serif;letter-spacing:0.12em;text-transform:uppercase',
          b.texto);
        a.setAttribute('href', b.href || '#/');
        box.appendChild(a);
      });
      return box;
    },
    lista: function (el, ctx) {
      var box = n('div', 'display:flex;flex-direction:column');
      (el.itens || []).forEach(function (it) {
        var linha = n('div', 'padding:16px 0;border-top:1px solid ' +
          (ctx.escuro ? 'rgba(249,249,249,0.25)' : 'rgba(44,43,34,0.25)'));
        linha.appendChild(n('h3', 'font:900 18px/1 "Roboto Condensed",sans-serif;text-transform:uppercase;color:' + cor(ctx.acento), it.titulo));
        linha.appendChild(n('p', 'margin-top:7px;font:400 14.5px/1.55 Roboto,sans-serif;color:' +
          (ctx.escuro ? 'rgba(249,249,249,0.78)' : '#2C2B22'), it.texto));
        box.appendChild(linha);
      });
      return box;
    },
    foto: function (el, ctx) {
      var b = n('div', 'position:relative;overflow:hidden;aspect-ratio:' + (el.proporcao || '4/3') +
        ';border:3px solid ' + (ctx.escuro ? '#F9F9F9' : '#2C2B22') +
        ';background:repeating-linear-gradient(135deg,#3a382d 0 9px,#2C2B22 9px 18px);display:grid;place-items:center;font:400 12px Roboto,sans-serif;color:rgba(249,249,249,0.5)',
        el.legenda || 'foto');
      b.setAttribute('data-photo-slot', '');
      return b;
    },
    galeria: function (el, ctx) {
      var cols = el.colunas || 2;
      var g = n('div', 'display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:12px');
      for (var i = 0; i < (el.quantidade || 4); i++) {
        g.appendChild(ELEMENTOS.foto({ proporcao: el.proporcao || '1/1', legenda: 'foto' }, ctx));
      }
      return g;
    }
  };

  /* renderiza uma faixa a partir do JSON */
  window.renderFaixa = function renderFaixa(cfg) {
    var fundo = cor(cfg.fundo);
    var escuro = claro(fundo);
    var ctx = { escuro: escuro, acento: cfg.acento || (escuro ? 'amarelo' : 'azul') };

    var sec = n('section', 'position:relative;overflow:hidden;background:' + fundo);

    if (cfg.decor && cfg.decor.tipo === 'raio') {
      var d = cfg.decor;
      var w = LARGURA_RAIO[d.tamanho || 'medio'];
      var lado = d.lado === 'direita' ? 'right:' + (d.sangra ? '-3%' : '0') : 'left:' + (d.sangra ? '-3%' : '0');
      sec.appendChild(n('span', 'position:absolute;top:0;' + lado + ';width:' + w + 'px;height:100%;background:' +
        cor(d.cor) + ';clip-path:' + RAIO + ';opacity:' + (d.opacidade != null ? d.opacidade : 0.9) + ';pointer-events:none'));
    }

    /* o conteúdo tem que desviar do raio: sem isso o texto colide
       com a decoração em telas estreitas */
    var recuo = '';
    if (cfg.decor && cfg.decor.tipo === 'raio') {
      var lw = LARGURA_RAIO[cfg.decor.tamanho || 'medio'];
      recuo = ';padding-' + (cfg.decor.lado === 'direita' ? 'right' : 'left') +
        ':max(28px,' + Math.round(lw * 0.62) + 'px)';
    }

    var grid = n('div', 'position:relative;max-width:1280px;margin:0 auto;padding:' +
      (cfg.espacamento || '80px 28px') + recuo + ';display:grid;grid-template-columns:' +
      (COLUNAS[cfg.layout] || COLUNAS['1']) + ';gap:' + (cfg.gap || '52px') + ';align-items:' + (cfg.alinhamento || 'start'));
    grid.className = 'faixa-grid';

    (cfg.quadrantes || []).forEach(function (quad) {
      var col = n('div');
      (quad || []).forEach(function (el) {
        var fn = ELEMENTOS[el.tipo];
        if (fn) col.appendChild(fn(el, ctx));
      });
      grid.appendChild(col);
    });

    sec.appendChild(grid);
    return sec;
  };
})();

/* demo: as duas faixas reais do site + variações, todas do mesmo JSON */
(function () {
  'use strict';

  var FLORESCER = {
    fundo: 'escuro', acento: 'laranja', layout: '2',
    decor: { tipo: 'raio', cor: 'laranja', lado: 'esquerda', tamanho: 'gigante', sangra: true, opacidade: 0.85 },
    quadrantes: [
      [
        { tipo: 'chip', texto: 'Programa', cor: 'laranja', estilo: 'contorno' },
        { tipo: 'titulo', texto: 'Bem-estar e permanência na Elétrica' },
        { tipo: 'paragrafo', texto: 'Programa do PET EEL dedicado ao bem-estar e à permanência dos estudantes na Engenharia Elétrica. Tem estrutura interna própria dentro do grupo.' },
        { tipo: 'botoes', itens: [
          { texto: 'O que é o Florescer', href: '#/florescer/o-que-e' },
          { texto: 'Estrutura interna', href: '#/florescer/estrutura-interna', variante: 'contorno' }
        ] }
      ],
      [
        { tipo: 'lista', itens: [
          { titulo: 'Acolhimento', texto: 'Espaços de conversa e apoio entre petianos e calouros do curso.' },
          { titulo: 'Permanência', texto: 'Ações que ajudam estudantes a atravessar as fases mais críticas da graduação.' },
          { titulo: 'Diversidade', texto: 'Iniciativas para tornar a Elétrica um curso mais plural.' }
        ] }
      ]
    ]
  };

  var PROCESSO = {
    fundo: 'amarelo', acento: 'escuro', layout: '2-60/40', alinhamento: 'center',
    decor: { tipo: 'raio', cor: 'offwhite', lado: 'direita', tamanho: 'medio', sangra: false, opacidade: 1 },
    quadrantes: [
      [
        { tipo: 'chip', texto: 'Processo seletivo', estilo: 'contorno' },
        { tipo: 'titulo', texto: 'Quer entrar no PET EEL?' },
        { tipo: 'paragrafo', texto: 'As vagas são abertas periodicamente para estudantes de Engenharia Elétrica e Eletrônica da UFSC. Datas e etapas são divulgadas aqui e no Instagram do grupo.' }
      ],
      [ { tipo: 'botoes', itens: [{ texto: 'Ver etapas', href: '#/processo-seletivo' }] } ]
    ]
  };

  /* mesma faixa, só trocando fundo/raio — o ponto do modelo */
  function recolorir(base, fundo, corRaio, acento) {
    var c = JSON.parse(JSON.stringify(base));
    c.fundo = fundo;
    if (c.decor) c.decor.cor = corRaio;
    if (acento) c.acento = acento;
    return c;
  }

  var COM_FOTOS = {
    fundo: 'offwhite', acento: 'azul', layout: '2-60/40', alinhamento: 'center',
    decor: { tipo: 'raio', cor: 'azul', lado: 'direita', tamanho: 'pequeno', sangra: true, opacidade: 0.15 },
    quadrantes: [
      [
        { tipo: 'chip', texto: 'Extensão', cor: 'azul' },
        { tipo: 'titulo', texto: 'Tech Week 2026' },
        { tipo: 'paragrafo', texto: 'Mesmo bloco, com um quadrante de galeria no lugar da lista.' },
        { tipo: 'botoes', itens: [{ texto: 'Ver programação', href: '#/tech-week' }] }
      ],
      [ { tipo: 'galeria', quantidade: 4, colunas: 2, proporcao: '4/3' } ]
    ]
  };

  var DEMOS = [
    ['Florescer — como está hoje no site', FLORESCER],
    ['Processo seletivo — como está hoje no site', PROCESSO],
    ['Mesma faixa do Florescer, fundo azul e raio amarelo', recolorir(FLORESCER, 'azul', 'amarelo', 'amarelo')],
    ['Mesma faixa do Processo seletivo, fundo escuro e raio laranja', recolorir(PROCESSO, 'escuro', 'laranja', 'laranja')],
    ['Quadrante de galeria no lugar da lista', COM_FOTOS]
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.getElementById('demo-faixas');
    if (!host || host.childElementCount) return;
    DEMOS.forEach(function (d) {
      var rot = document.createElement('p');
      rot.style.cssText = 'max-width:1280px;margin:44px auto 10px;padding:0 28px;font:700 11.5px/1 "Roboto Condensed",sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:rgba(44,43,34,0.55)';
      rot.textContent = d[0];
      host.appendChild(rot);
      host.appendChild(window.renderFaixa(d[1]));
    });
  });
})();
