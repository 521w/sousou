FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null; npm install --production=false 2>/dev/null; npm install
COPY . .
RUN npx tsc --noEmit 2>/dev/null; npm run build
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860
CMD ["node", "--loader", "tsx", "server.ts"]