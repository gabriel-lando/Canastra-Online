# Canastra / Buraco

Jogo de cartas online em tempo real, baseado nas regras de Buraco/Canastra. Para 4 jogadores em 2 duplas.

## Como jogar

1. Acesse a URL do servidor.
2. Digite seu nome e clique **Entrar no Jogo**.
3. No lobby, escolha seu time (Time A ou Time B) e clique **Pronto**.
4. Quando todos os 4 jogadores estiverem prontos e os times estiverem balanceados (2x2), o jogo inicia automaticamente.

## Tecnologias

- **Backend**: Node.js + Express + WebSocket (ws)
- **Frontend**: React + Vite + TypeScript
- **Deploy**: Docker + docker-compose

## Desenvolvimento local

### Requisitos
- Node.js 22+

### Rodando localmente

```bash
# 1. Instalar dependencias do frontend
npm install

# 2. Instalar dependencias do backend
cd server && npm install && cd ..

# 3. Build do frontend
npm run build

# 4. Build do backend
cd server && npm run build && cd ..

# 5. Iniciar o servidor (serve frontend + API na mesma porta)
node server/dist/index.js
```

Acesse: http://localhost:3000

### Desenvolvimento com hot-reload

Em dois terminais:

```bash
# Terminal 1 - backend em watch mode
cd server && npm run dev

# Terminal 2 - frontend com vite dev server (proxy para /api -> localhost:3000)
npm run dev
```

## Docker

### Build e deploy

```bash
# Build e iniciar
docker compose up --build

# Em background
docker compose up -d --build

# Parar
docker compose down
```

O servidor roda na porta **3000**. Para usar com um domínio (ex: canastra.example.com), configure um reverse proxy (nginx, Caddy, Traefik) apontando para `localhost:3000`.

### Exemplo de configuração nginx para subdomínio

```nginx
server {
    listen 80;
    server_name canastra.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Arquitetura

```
/
├── src/                    # Frontend React
│   ├── App.tsx             # Componente principal + roteamento de fase
│   ├── socket.ts           # Cliente WebSocket
│   ├── types.ts            # Tipos compartilhados
│   ├── App.css             # Estilos
│   └── components/
│       ├── CardView.tsx    # Componente de carta
│       ├── MeldView.tsx    # Componente de joguinho/canastra
│       ├── Lobby.tsx       # Tela de lobby
│       ├── GameBoard.tsx   # Mesa de jogo
│       └── RoundEnd.tsx    # Fim de rodada / fim de jogo
├── server/
│   └── src/
│       ├── index.ts        # Express + WebSocket server
│       ├── game.ts         # Lógica do jogo
│       ├── cards.ts        # Baralho, validacoes, pontuacao
│       └── types.ts        # Tipos do servidor
├── Dockerfile
├── docker-compose.yml
└── .dockerignore
```

## Segurança

- O UUID privado do jogador só é enviado para ele no momento do `welcome`.
- Outros jogadores veem apenas o `publicId` (8 chars) e o nome.
- Toda ação do jogo é validada no servidor; o frontend não pode trapacear.
- O jogador só recebe suas próprias cartas; as cartas de outros jogadores nunca são enviadas.

## Regras implementadas

- ✅ 2 baralhos sem joker (104 cartas)
- ✅ 4 jogadores, 2 duplas, turnos alternados
- ✅ 11 cartas por jogador
- ✅ Coringas (2s) não podem ser maioria
- ✅ Exceção: grupos de 2s e sequências que passam pelo rank 2 são naturais
- ✅ Pontuação: A=15, 7-K=10, 3-6=5, 2=10
- ✅ Comprar do monte ou pegar o lixo
- ✅ Regra especial: 1 carta na mão + 1 no lixo → obrigatório comprar do monte
- ✅ Grupos (mesmo rank) e sequências (mesmo naipe, consecutivas)
- ✅ Canastras (7+ cartas): limpa=+200, suja=+100
- ✅ Primeira baixa fora do buraco: sem restrição de pontos
- ✅ Primeira baixa no buraco (≥1000 pts): mínimo 100 pontos
- ✅ Adicionar cartas a joguinhos existentes
- ✅ Bater: precisa de pelo menos 1 canastra, +50 bônus
- ✅ Fim de rodada: cartas na mão = pontos negativos
- ✅ Vitória: 2000 pontos
