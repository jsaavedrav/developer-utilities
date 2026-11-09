/* Valores aleatorios: UUID v4, tokens hexadecimales y Base64, contraseñas. */
(function () {
  const { register, lib, helpers } = window.Utilitario;
  const { html, copyButton } = helpers;

  function randomBytes(n) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function hex(n) {
    return Array.from(randomBytes(n), b => b.toString(16).padStart(2, '0')).join('');
  }

  function base64url(n) {
    let binary = '';
    randomBytes(n).forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  const PASSWORD_CHARS =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*-_=+?';

  // Rechazo de muestras para que todos los caracteres sean equiprobables.
  function password(length) {
    const limit = 256 - (256 % PASSWORD_CHARS.length);
    let out = '';
    while (out.length < length) {
      for (const b of randomBytes(length * 2)) {
        if (b < limit && out.length < length) out += PASSWORD_CHARS[b % PASSWORD_CHARS.length];
      }
    }
    return out;
  }

  const TYPES = {
    uuid: { label: 'UUID v4', sizeLabel: null, make: () => crypto.randomUUID() },
    hex: { label: 'Hexadecimal', sizeLabel: 'Bytes', defaultSize: 32, make: hex },
    base64url: { label: 'Base64 URL-safe', sizeLabel: 'Bytes', defaultSize: 32, make: base64url },
    password: { label: 'Contraseña', sizeLabel: 'Caracteres', defaultSize: 20, make: password }
  };

  lib.random = { hex, base64url, password };

  register({
    id: 'random',
    group: 'Generadores',
    name: 'Valores aleatorios',
    description: 'UUIDs, tokens y contraseñas generados con el generador criptográfico del sistema.',
    render(container) {
      const typeOptions = Object.entries(TYPES)
        .map(([value, t]) => `<option value="${value}">${t.label}</option>`)
        .join('');

      const card = html(`
        <div class="card">
          <div class="row">
            <div class="field">
              <label for="random-type">Tipo</label>
              <select id="random-type">${typeOptions}</select>
            </div>
            <div class="field field-small" data-role="size-field">
              <label for="random-size" data-role="size-label">Bytes</label>
              <input type="number" id="random-size" min="1" max="512" />
            </div>
            <div class="field field-small">
              <label for="random-count">Cantidad</label>
              <input type="number" id="random-count" min="1" max="1000" value="5" />
            </div>
          </div>
          <div class="actions">
            <button type="button" class="primary" data-role="generate">Generar</button>
          </div>
          <div class="output-header"><label>Resultado</label></div>
          <textarea data-role="output" readonly></textarea>
          <div class="error" data-role="error"></div>
        </div>`);

      const typeEl = card.querySelector('#random-type');
      const sizeField = card.querySelector('[data-role="size-field"]');
      const sizeLabel = card.querySelector('[data-role="size-label"]');
      const sizeEl = card.querySelector('#random-size');
      const countEl = card.querySelector('#random-count');
      const output = card.querySelector('[data-role="output"]');
      const error = card.querySelector('[data-role="error"]');
      card.querySelector('.output-header').appendChild(copyButton(output));

      function updateType() {
        const t = TYPES[typeEl.value];
        sizeField.style.display = t.sizeLabel ? '' : 'none';
        if (t.sizeLabel) {
          sizeLabel.textContent = t.sizeLabel;
          sizeEl.value = t.defaultSize;
        }
      }

      function generate() {
        const t = TYPES[typeEl.value];
        const count = Number(countEl.value);
        const size = Number(sizeEl.value);
        if (!Number.isInteger(count) || count < 1 || count > 1000) {
          error.textContent = 'La cantidad debe ser un número entre 1 y 1000.';
          return;
        }
        if (t.sizeLabel && (!Number.isInteger(size) || size < 1 || size > 512)) {
          error.textContent = `${t.sizeLabel} debe ser un número entre 1 y 512.`;
          return;
        }
        error.textContent = '';
        output.value = Array.from({ length: count }, () => t.make(size)).join('\n');
      }

      typeEl.addEventListener('change', () => { updateType(); generate(); });
      card.querySelector('[data-role="generate"]').addEventListener('click', generate);

      container.appendChild(card);
      updateType();
      generate();
    }
  });
})();
