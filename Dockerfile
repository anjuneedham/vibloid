# Single container: web (Next.js) + worker (FFmpeg jobs). Media lives on a mounted volume at /data.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-inter fonts-dejavu-core bash ca-certificates python3 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV NODE_ENV=production \
    STORAGE_DIR=/data \
    PORT=3000
VOLUME /data
EXPOSE 3000

CMD ["bash", "scripts/start.sh"]
