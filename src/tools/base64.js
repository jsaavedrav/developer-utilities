/* Base64 con soporte UTF-8 (tildes, ñ, emojis). */
(function () {
  const { register, transformTool, lib } = window.Utilitario;

  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function decodeBase64(text) {
    // Acepta también la variante URL-safe (- y _) y sin relleno (=).
    let normalized = text.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (normalized.length % 4) normalized += '=';
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  lib.base64 = { encode: encodeBase64, decode: decodeBase64 };

  register(transformTool({
    id: 'base64-decode',
    group: 'Codificación',
    name: 'Base64 · Decodificar',
    description: 'Convierte texto en Base64 (estándar o URL-safe) a texto plano.',
    inputLabel: 'Texto en Base64',
    placeholder: 'eyJmZWNoYV9pbmljaW8iOiAiMjAyNS0wOS0yNSJ9',
    actionLabel: 'Decodificar',
    formatJSON: true,
    trimInput: true,
    transform(text) {
      if (!text) return '';
      try {
        return decodeBase64(text);
      } catch (e) {
        throw new Error('Error: el texto no es un Base64 válido.');
      }
    }
  }));

  register(transformTool({
    id: 'base64-encode',
    group: 'Codificación',
    name: 'Base64 · Codificar',
    description: 'Convierte texto plano a Base64.',
    inputLabel: 'Texto plano',
    placeholder: '{"fecha_inicio": "2025-09-25"}',
    actionLabel: 'Codificar',
    transform: encodeBase64
  }));
})();
