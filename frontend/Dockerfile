FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Menggunakan dev mode agar hot-reload aktif saat coding
CMD ["npm", "run", "dev"]