/* RUT chileno: generación aleatoria, validación y formateo. */
(function () {
  const { register, lib, helpers } = window.Utilitario;
  const { html, copyButton } = helpers;

  const FORMATS = {
    puntos: { label: 'Con puntos y guion (12.345.678-5)' },
    guion: { label: 'Solo guion (12345678-5)' },
    plano: { label: 'Sin formato (123456785)' }
  };

  // Dígito verificador por módulo 11.
  function computeDV(body) {
    const digits = String(body);
    let sum = 0;
    let factor = 2;
    for (let i = digits.length - 1; i >= 0; i--) {
      sum += Number(digits[i]) * factor;
      factor = factor === 7 ? 2 : factor + 1;
    }
    const dv = 11 - (sum % 11);
    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return String(dv);
  }

  function format(body, dv, style) {
    const digits = String(body);
    if (style === 'plano') return digits + dv;
    if (style === 'guion') return `${digits}-${dv}`;
    return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
  }

  /*
   * Valida un RUT escrito en cualquier formato. Devuelve
   * { valid, body, dv, expected } o lanza un Error si no tiene forma de RUT.
   */
  function parse(text) {
    const cleaned = String(text).replace(/[.\-\s]/g, '').toUpperCase();
    if (!/^\d{1,9}[0-9K]$/.test(cleaned)) {
      throw new Error('no tiene formato de RUT');
    }
    const body = cleaned.slice(0, -1).replace(/^0+(?=\d)/, '');
    const dv = cleaned.slice(-1);
    const expected = computeDV(body);
    return { valid: dv === expected, body, dv, expected };
  }

  function randomInt(min, max) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return min + (buf[0] % (max - min + 1));
  }

  // Cuerpos entre 1.000.000 y 29.999.999, el rango de RUTs de personas.
  function generate(count, style) {
    const result = [];
    for (let i = 0; i < count; i++) {
      const body = randomInt(1000000, 29999999);
      result.push(format(body, computeDV(body), style));
    }
    return result;
  }

  lib.rut = { computeDV, format, parse, generate };

  register({
    id: 'rut',
    group: 'Generadores',
    name: 'RUT',
    description: 'Genera RUTs chilenos válidos al azar, y valida o formatea RUTs existentes.',
    render(container) {
      const formatOptions = Object.entries(FORMATS)
        .map(([value, f]) => `<option value="${value}">${f.label}</option>`)
        .join('');

      const genCard = html(`
        <div class="card">
          <div class="row">
            <div class="field field-small">
              <label for="rut-count">Cantidad</label>
              <input type="number" id="rut-count" min="1" max="1000" value="10" />
            </div>
            <div class="field">
              <label for="rut-format">Formato</label>
              <select id="rut-format">${formatOptions}</select>
            </div>
          </div>
          <div class="actions">
            <button type="button" class="primary" data-role="generate">Generar</button>
          </div>
          <div class="output-header"><label>RUTs generados</label></div>
          <textarea data-role="generated" readonly></textarea>
          <div class="error" data-role="gen-error"></div>
        </div>`);

      const valCard = html(`
        <div class="card">
          <label for="rut-validate">Validar y formatear (uno por línea)</label>
          <textarea id="rut-validate" placeholder="12345678-5&#10;9.876.543-K&#10;111111111"></textarea>
          <div class="output-header" style="margin-top:1.4rem"><label>Resultado</label></div>
          <textarea data-role="validated" readonly placeholder="El resultado aparecerá aquí..."></textarea>
        </div>`);

      const countEl = genCard.querySelector('#rut-count');
      const formatEl = genCard.querySelector('#rut-format');
      const generated = genCard.querySelector('[data-role="generated"]');
      const genError = genCard.querySelector('[data-role="gen-error"]');
      genCard.querySelector('.output-header').appendChild(copyButton(generated));

      function runGenerate() {
        const count = Number(countEl.value);
        if (!Number.isInteger(count) || count < 1 || count > 1000) {
          genError.textContent = 'La cantidad debe ser un número entre 1 y 1000.';
          return;
        }
        genError.textContent = '';
        generated.value = generate(count, formatEl.value).join('\n');
      }

      const validateInput = valCard.querySelector('#rut-validate');
      const validated = valCard.querySelector('[data-role="validated"]');
      valCard.querySelector('.output-header').appendChild(copyButton(validated));

      function runValidate() {
        validated.value = validateInput.value
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .map(line => {
            try {
              const r = parse(line);
              if (r.valid) return `✓ ${format(r.body, r.dv, formatEl.value)}`;
              return `✗ ${line}: el dígito verificador debería ser ${r.expected}`;
            } catch (e) {
              return `✗ ${line}: ${e.message}`;
            }
          })
          .join('\n');
      }

      genCard.querySelector('[data-role="generate"]').addEventListener('click', runGenerate);
      formatEl.addEventListener('change', () => { runGenerate(); runValidate(); });
      validateInput.addEventListener('input', runValidate);

      container.appendChild(genCard);
      container.appendChild(valCard);
      runGenerate();
    }
  });
})();
