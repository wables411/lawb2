FROM node:18-slim

# Install curl and unzip
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Download Stockfish binary (Linux, static)
RUN curl -L -o /tmp/stockfish.zip https://stockfishchess.org/files/stockfish_15.1_linux_x64_avx2.zip && \
    unzip /tmp/stockfish.zip -d /usr/local/bin/ && \
    chmod +x /usr/local/bin/stockfish_15.1_x64_avx2 && \
    mv /usr/local/bin/stockfish_15.1_x64_avx2 /usr/local/bin/stockfish && \
    rm /tmp/stockfish.zip

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3001

CMD ["node", "stockfish-api.cjs"] 