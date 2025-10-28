FROM node:18-alpine

WORKDIR /app

COPY verifier/package*.json ./

RUN npm ci

COPY verifier/ .

RUN npm run build

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

CMD ["npm", "run", "dev"]
