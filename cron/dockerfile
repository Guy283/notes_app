FROM node:18-alpine

# Install cron
RUN apk add --no-cache busybox-suid

WORKDIR /app

# Copy only what we need
COPY src ./src
COPY package.json ./

# Install prod deps only
RUN npm install --omit=dev

# Add cron job
RUN echo "0 2 * * * node /app/src/purge.js >> /var/log/purge.log 2>&1" > /etc/crontabs/root

# Start cron in foreground
CMD ["crond", "-f", "-l", "2"]
