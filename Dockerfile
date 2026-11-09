# Versión web: sirve la misma carpeta src/ que usa la app de escritorio.
# Todo se procesa en el navegador; el servidor solo entrega archivos estáticos.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx src/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
