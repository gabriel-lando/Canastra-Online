# Canastra / Buraco

Jogo de cartas online em tempo real, baseado nas regras de Buraco/Canastra. Para 4 jogadores em 2 duplas.

🌐 **Demo**: [canastra.gabriellando.com](https://canastra.gabriellando.com/)

📦 **Docker Hub**: [gabriellando/canastra-online](https://hub.docker.com/r/gabriellando/canastra-online)

💻 **Código-fonte**: [github.com/gabriel-lando/Canastra-Online](https://github.com/gabriel-lando/Canastra-Online)

---

## Como jogar

1. Acesse a URL do servidor.
2. Digite seu nome e clique **Entrar no Jogo**.
3. Crie uma sala ou entre em uma sala pública/por código.
4. No lobby, escolha seu time e clique **Pronto**. O líder pode renomear os times, reordenar jogadores e remover membros.
5. Quando todos os 4 jogadores estiverem prontos com os times balanceados (2×2), o jogo inicia automaticamente.

## Tecnologias

- **Backend**: Node.js 22 + Express + WebSocket (`ws`) + TypeScript
- **Frontend**: React 19 + Vite + TypeScript
- **i18n**: Português (BR) e Inglês, com troca em tempo real
- **Deploy**: Docker + docker-compose (build multi-stage); imagem publicada no Docker Hub

---

## Rodando com Docker (recomendado)

### docker run

```bash
docker run -d --name canastra-online -p 3000:3000 --restart unless-stopped gabriellando/canastra-online:latest
```

Acesse: http://localhost:3000

### docker-compose (usando imagem do Docker Hub)

```yaml
services:
  canastra-online:
    image: gabriellando/canastra-online:latest
    container_name: canastra-online
    ports:
      - '3000:3000'
    restart: unless-stopped
```

```bash
docker compose up -d
```

### Variáveis de ambiente

| Variável | Padrão | Descrição                      |
| -------- | ------ | ------------------------------ |
| `PORT`   | `3000` | Porta em que o servidor escuta |

---

## Desenvolvimento local

### Requisitos

- Node.js 22+

### Rodando localmente

```bash
# 1. Instalar dependências do frontend e backend
npm run install:all

# 2. Build do frontend e backend
npm run build

# 3. Iniciar o servidor (serve frontend + API na mesma porta)
node server/dist/index.js
```

Acesse: http://localhost:3000

### Desenvolvimento com hot-reload

Em dois terminais:

```bash
# Terminal 1 - backend em watch mode (tsx watch)
npm run dev:server

# Terminal 2 - frontend com vite dev server (proxy /api → localhost:3000)
npm run dev:client
```

## Docker (build local)

```bash
# Build e iniciar
docker compose up --build

# Em background
docker compose up -d --build

# Parar
docker compose down
```

O servidor roda na porta **3000** (configurável via variável de ambiente `PORT`). Para usar com um domínio, configure um reverse proxy (nginx, Caddy, Traefik) apontando para `localhost:3000`.

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
Browser ──── WebSocket /api/ws?room=CÓDIGO ───┐
       ──── REST /api/rooms               ────┴── Express (porta 3000)
                                               └── static /dist (build Vite)
```

```
/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── App.tsx             # Componente raiz + máquina de estados (nameEntry → roomSelect → game)
│   │   ├── socket.ts           # Cliente WebSocket
│   │   ├── types.ts            # Tipos compartilhados
│   │   ├── App.css             # Estilos globais
│   │   ├── i18n/               # Internacionalização (pt-BR padrão, en disponível)
│   │   └── components/
│   │       ├── RoomSelect.tsx      # Criar / listar salas públicas / entrar por código
│   │       ├── Lobby.tsx           # Lobby pré-jogo com drag-and-drop (desktop) e tap (mobile)
│   │       ├── GameBoard.tsx       # Mesa de jogo principal
│   │       ├── CardView.tsx        # Componente de carta individual
│   │       ├── MeldView.tsx        # Componente de joguinho/canastra
│   │       ├── RoundEnd.tsx        # Placar de fim de rodada e fim de jogo
│   │       └── LanguageSwitcher.tsx# Alternância de idioma (🇧🇷 / 🇺🇸)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/
│   └── src/
│       ├── index.ts            # Express + WebSocket server + REST API + gerenciamento de salas
│       ├── game.ts             # Lógica completa do jogo
│       ├── cards.ts            # Baralho, validações, pontuação
│       └── types.ts            # Tipos do servidor
├── package.json                # Scripts de orquestração (install:all, build, dev:client, dev:server)
├── Dockerfile                  # Build multi-stage (frontend-builder → backend-builder → production)
├── docker-compose.yml
└── .dockerignore
```

## Segurança

- O UUID privado do jogador (`playerId`) é enviado apenas a ele no momento do `welcome`.
- Outros jogadores veem somente o `publicId` (8 chars) e o nome.
- Toda ação do jogo é validada no servidor; o frontend não pode trapacear.
- O jogador recebe apenas suas próprias cartas; a mão dos adversários nunca é transmitida.
- Nomes são sanitizados no servidor (remoção de `<>&"'` para prevenção de XSS).

## Regras implementadas

### Configuração

- ✅ 2 baralhos sem coringa (104 cartas) — **2s são coringas**
- ✅ 4 jogadores, 2 duplas, assentos intercalados (A1→B1→A2→B2)
- ✅ 13 cartas por jogador

### Turno

- ✅ Comprar do monte ou pegar o lixo inteiro
- ✅ Regra especial: 1 carta na mão + 1 no lixo → obrigatório comprar do monte
- ✅ Baixar joguinhos e adicionar cartas a joguinhos existentes (opcional, repetível)
- ✅ Descartar uma carta para encerrar o turno

### Joguinhos

- ✅ **Grupos**: mesmo rank, 3+ cartas; coringas não podem ser maioria
- ✅ **Sequências**: mesmo naipe, consecutive, 3+ cartas; Ás pode ser baixo (A,2,3…) ou alto (…Q,K,A)
- ✅ Grupos de 2s puros e sequências com 2 natural no naipe correto são considerados naturais
- ✅ **Canastras** (7+ cartas): limpa (sem coringa) = +200 pts, suja (com coringa) = +100 pts

### Pontuação

- ✅ A = 15 pts · 7–K = 10 pts · 3–6 = 5 pts · 2 (coringa) = 10 pts
- ✅ Cartas na mão ao fim da rodada = pontos negativos
- ✅ Bater: precisa de pelo menos 1 canastra, bônus de +50 pts
- ✅ Monte esgotado: último comprador descarta e a rodada termina (sem bônus de bater)
- ✅ Primeira baixa **fora do buraco**: sem restrição de pontos
- ✅ Primeira baixa **no buraco** (≥ 1.000 pts acumulados): mínimo de 100 pts na baixa
- ✅ **Vitória**: primeiro time a atingir 2.000 pontos

### Outras

- ✅ Reconexão automática via token de sessão; jogo pausado enquanto jogador está offline
- ✅ Contador regressivo de 10 minutos exibido ao aguardar reconexão; partida cancelada se expirar
- ✅ Sala encerrada automaticamente quando o líder sai do lobby
- ✅ Interface responsiva (mobile e desktop)
- ✅ Salas públicas e privadas com código de 6 caracteres (alfanumérico sem ambiguidade)
- ✅ Líder pode renomear times, mover e remover jogadores
- ✅ Rotação do assento inicial a cada rodada
