/*
 * Cifrado AES-256-GCM con contraseña.
 *
 * La clave se deriva con PBKDF2-SHA256 (600.000 iteraciones) y una sal
 * aleatoria. El resultado es Base64 de: versión (1 byte) | sal (16) | IV (12) |
 * texto cifrado con su etiqueta de autenticación.
 */
(function () {
  const { register, lib, helpers } = window.Utilitario;
  const { html, copyButton } = helpers;

  const VERSION = 1;
  const ITERATIONS = 600000;
  const SALT_BYTES = 16;
  const IV_BYTES = 12;

  async function deriveKey(passphrase, salt) {
    const material = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
      material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  function bytesToBase64(bytes) {
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToBytes(text) {
    return Uint8Array.from(atob(text.replace(/\s+/g, '')), c => c.charCodeAt(0));
  }

  async function encrypt(plaintext, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(passphrase, salt);
    const cipher = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));

    const out = new Uint8Array(1 + SALT_BYTES + IV_BYTES + cipher.length);
    out[0] = VERSION;
    out.set(salt, 1);
    out.set(iv, 1 + SALT_BYTES);
    out.set(cipher, 1 + SALT_BYTES + IV_BYTES);
    return bytesToBase64(out);
  }

  async function decrypt(encoded, passphrase) {
    let data;
    try {
      data = base64ToBytes(encoded);
    } catch (e) {
      throw new Error('El texto cifrado no es un Base64 válido.');
    }
    if (data.length < 1 + SALT_BYTES + IV_BYTES + 16 || data[0] !== VERSION) {
      throw new Error('El texto no fue cifrado con esta herramienta.');
    }
    const salt = data.slice(1, 1 + SALT_BYTES);
    const iv = data.slice(1 + SALT_BYTES, 1 + SALT_BYTES + IV_BYTES);
    const cipher = data.slice(1 + SALT_BYTES + IV_BYTES);
    const key = await deriveKey(passphrase, salt);
    try {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
      return new TextDecoder().decode(plain);
    } catch (e) {
      throw new Error('Contraseña incorrecta o texto cifrado modificado.');
    }
  }

  lib.aes = { encrypt, decrypt };

  register({
    id: 'aes',
    group: 'Criptografía',
    name: 'Cifrar / Descifrar (AES)',
    description: 'Cifra texto con una contraseña usando AES-256-GCM. Para descifrar se necesita la misma contraseña.',
    render(container) {
      const card = html(`
        <div class="card">
          <label for="aes-password">Contraseña</label>
          <input type="password" id="aes-password" autocomplete="off" />
          <div style="height:1rem"></div>
          <label for="aes-input">Texto</label>
          <textarea id="aes-input" placeholder="Texto plano para cifrar, o texto cifrado para descifrar..."></textarea>
          <div class="actions">
            <button type="button" class="primary" data-role="encrypt">Cifrar</button>
            <button type="button" class="primary" data-role="decrypt">Descifrar</button>
            <button type="button" data-role="clear">Limpiar</button>
          </div>
          <div class="output-header"><label>Resultado</label></div>
          <textarea data-role="output" readonly placeholder="El resultado aparecerá aquí..."></textarea>
          <div class="error" data-role="error"></div>
        </div>`);

      const pass = card.querySelector('#aes-password');
      const input = card.querySelector('#aes-input');
      const output = card.querySelector('[data-role="output"]');
      const error = card.querySelector('[data-role="error"]');
      card.querySelector('.output-header').appendChild(copyButton(output));

      async function run(action) {
        if (!pass.value) {
          error.textContent = 'Ingresa una contraseña.';
          return;
        }
        if (!input.value) {
          error.textContent = 'Ingresa el texto.';
          return;
        }
        error.textContent = action === encrypt ? 'Cifrando...' : 'Descifrando...';
        error.classList.add('busy');
        output.value = '';
        try {
          output.value = await action(action === decrypt ? input.value.trim() : input.value, pass.value);
          error.textContent = '';
        } catch (e) {
          error.textContent = e.message;
        } finally {
          error.classList.remove('busy');
        }
      }

      card.querySelector('[data-role="encrypt"]').addEventListener('click', () => run(encrypt));
      card.querySelector('[data-role="decrypt"]').addEventListener('click', () => run(decrypt));
      card.querySelector('[data-role="clear"]').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        error.textContent = '';
      });

      container.appendChild(card);
    }
  });
})();
