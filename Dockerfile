FROM denoland/deno:ubuntu-1.42.1

COPY . /app
WORKDIR /app

CMD deno run -A main.ts
