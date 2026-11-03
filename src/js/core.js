/*
 * Núcleo del utilitario: registro de herramientas, navegación y helpers
 * compartidos. Se carga como script clásico (no módulo ES) para que la app
 * funcione abriendo index.html directamente desde el disco.
 */
(function () {
  'use strict';

  const tools = [];

  const COPY_ICON =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  /* ---------- Helpers ---------- */

  // Crea un elemento a partir de un string HTML.
  function html(markup) {
    const tpl = document.createElement('template');
    tpl.innerHTML = markup.trim();
    return tpl.content.firstElementChild;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(message) {
    const t = document.getElementById('toast');
    t.textContent = message || 'Copiado al portapapeles';
    t.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function copyText(value, fallbackEl) {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => showToast()).catch(() => {
      if (!fallbackEl) return;
      fallbackEl.select();
      document.execCommand('copy');
      showToast();
    });
  }

  // Botón "Copiar" que copia el valor de un textarea/input.
  function copyButton(sourceEl) {
    const btn = html(`<button class="copy-btn" type="button">${COPY_ICON} Copiar</button>`);
    btn.addEventListener('click', () => copyText(sourceEl.value, sourceEl));
    return btn;
  }

  // Devuelve el JSON indentado; lanza error si no es válido.
  function prettyJSON(text) {
    return JSON.stringify(JSON.parse(text), null, 2);
  }

  /*
   * Fábrica para el caso más común: un texto de entrada que se transforma en
   * un texto de salida. `transform` recibe la entrada y devuelve el resultado
   * (o lanza un Error cuyo mensaje se muestra al usuario).
   */
  function transformTool(opts) {
    return {
      id: opts.id,
      group: opts.group,
      name: opts.name,
      title: opts.title || opts.name,
      description: opts.description || '',
      render(container) {
        const card = html(`
          <div class="card">
            <label>${escapeHtml(opts.inputLabel || 'Entrada')}</label>
            <textarea data-role="input"></textarea>
            <div class="actions"></div>
            <div class="output-header"><label>Resultado</label></div>
            <textarea data-role="output" readonly placeholder="El resultado aparecerá aquí..."></textarea>
            <div class="error" data-role="error"></div>
          </div>`);

        const input = card.querySelector('[data-role="input"]');
        const output = card.querySelector('[data-role="output"]');
        const error = card.querySelector('[data-role="error"]');
        const actions = card.querySelector('.actions');
        input.placeholder = opts.placeholder || '';
        card.querySelector('.output-header').appendChild(copyButton(output));

        function run() {
          try {
            output.value = opts.transform(opts.trimInput ? input.value.trim() : input.value);
            error.textContent = '';
          } catch (e) {
            output.value = '';
            error.textContent = e.message;
          }
        }

        function addAction(label, onClick, primary) {
          const btn = html(`<button type="button"${primary ? ' class="primary"' : ''}>${escapeHtml(label)}</button>`);
          btn.addEventListener('click', onClick);
          actions.appendChild(btn);
        }

        input.addEventListener('input', run);
        addAction(opts.actionLabel || 'Procesar', run, true);
        if (opts.formatJSON) {
          addAction('Formatear JSON', () => {
            try {
              output.value = prettyJSON(output.value);
              error.textContent = '';
            } catch (e) {
              error.textContent = 'El resultado no es un JSON válido.';
            }
          });
        }
        addAction('Limpiar', () => {
          input.value = '';
          output.value = '';
          error.textContent = '';
        });

        container.appendChild(card);
      }
    };
  }

  /* ---------- Registro y navegación ---------- */

  function register(tool) {
    if (!tool.id || !tool.name || typeof tool.render !== 'function') {
      throw new Error('Herramienta inválida: requiere id, name y render().');
    }
    if (tools.some(t => t.id === tool.id)) {
      throw new Error(`Ya existe una herramienta con id "${tool.id}".`);
    }
    tools.push(tool);
  }

  function buildNav() {
    const nav = document.getElementById('nav');
    const groups = new Map();
    for (const tool of tools) {
      const group = tool.group || 'Otras';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(tool);
    }
    for (const [group, items] of groups) {
      const section = html(`<div class="nav-group"><div class="nav-group-title">${escapeHtml(group)}</div></div>`);
      for (const tool of items) {
        const btn = html(`<button class="nav-item" type="button" data-tool="${escapeHtml(tool.id)}">${escapeHtml(tool.name)}</button>`);
        btn.addEventListener('click', () => { location.hash = tool.id; });
        section.appendChild(btn);
      }
      nav.appendChild(section);
    }
  }

  function show(id) {
    const tool = tools.find(t => t.id === id) || tools[0];
    if (!tool) return;

    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === tool.id);
    });

    const main = document.getElementById('main');
    main.innerHTML = '';
    main.appendChild(html(`
      <header class="tool-header">
        <h1>${escapeHtml(tool.title || tool.name)}</h1>
        ${tool.description ? `<p>${escapeHtml(tool.description)}</p>` : ''}
      </header>`));
    tool.render(main);
    document.title = `${tool.name} · Developer Utilities`;

    const firstField = main.querySelector('textarea:not([readonly]), input');
    if (firstField) firstField.focus();
  }

  function start() {
    buildNav();
    show(location.hash.slice(1));
    window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  }

  document.addEventListener('DOMContentLoaded', start);

  window.Utilitario = {
    register,
    transformTool,
    helpers: { html, escapeHtml, copyText, copyButton, showToast, prettyJSON }
  };
})();
