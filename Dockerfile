FROM nginx:alpine

# Copiar archivos estáticos de forma segura para Nginx (solo lectura recomendada para producción)
COPY --chown=root:root . /usr/share/nginx/html
