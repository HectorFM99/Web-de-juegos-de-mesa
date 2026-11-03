FROM nginx:alpine
COPY --chown=nginx:nginx . /usr/share/nginx/html