# Use nginx alpine (lightweight Linux distribution)
FROM nginx:alpine

# Copy PWA files to nginx's default html directory
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY icons/ /usr/share/nginx/html/icons/

# Copy SSL certificates
COPY localhost+2.pem /etc/nginx/ssl/
COPY localhost+2-key.pem /etc/nginx/ssl/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose HTTPS port
EXPOSE 443

# nginx runs automatically when container starts
