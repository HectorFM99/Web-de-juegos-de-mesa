FROM nginx:alpine

# Configuración de Nginx (cabeceras de seguridad, rate limiting, timeouts).
# Va en /etc/nginx y no en la carpeta pública, para que no se pueda descargar desde la web.
COPY --chown=root:root nginx.conf /etc/nginx/nginx.conf

# Solo se publican los archivos del frontend (lista blanca), en modo solo lectura.
COPY --chown=root:root index.html /usr/share/nginx/html/
COPY --chown=root:root html /usr/share/nginx/html/html
COPY --chown=root:root css /usr/share/nginx/html/css
COPY --chown=root:root js /usr/share/nginx/html/js

# Comprueba la sintaxis de la configuración al construir la imagen.
RUN chmod -R a-w /usr/share/nginx/html && nginx -t
