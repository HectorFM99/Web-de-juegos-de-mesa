FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY html/ /usr/share/nginx/html/html/
COPY nginx.conf /etc/nginx/nginx.conf
