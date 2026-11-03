/* URL percent-encoding (encodeURIComponent / decodeURIComponent). */
(function () {
  const { register, transformTool } = window.Utilitario;

  register(transformTool({
    id: 'url-decode',
    group: 'Codificación',
    name: 'URL · Decodificar',
    description: 'Convierte texto con percent-encoding (%22, %3A…) a texto plano.',
    inputLabel: 'Texto codificado',
    placeholder: '{%22fecha_inicio%22%3A{%22eq%22%3A%222025-09-25%22}}',
    actionLabel: 'Decodificar',
    formatJSON: true,
    transform(text) {
      try {
        return decodeURIComponent(text);
      } catch (e) {
        throw new Error('Error: el texto no es un URL encoding válido.');
      }
    }
  }));

  register(transformTool({
    id: 'url-encode',
    group: 'Codificación',
    name: 'URL · Codificar',
    description: 'Aplica percent-encoding a un texto para usarlo en una URL.',
    inputLabel: 'Texto plano',
    placeholder: '{"fecha_inicio":{"eq":"2025-09-25"}}',
    actionLabel: 'Codificar',
    transform: text => encodeURIComponent(text)
  }));
})();
