# Duck Migration

Ferramenta desktop offline para migracao de dados entre bancos MongoDB.

Permite cadastrar conexoes MongoDB, selecionar collections e migrar dados de um banco para outro com progresso em tempo real, sem precisar usar `mongodump`/`mongorestore`.

## Stack

- **Desktop**: Tauri 2 (janela nativa, ~10MB)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend (sidecar)**: Node.js + Fastify + MongoDB driver
- **Persistencia**: SQLite (conexoes criptografadas + historico)

## Funcionalidades

- Cadastro de conexoes MongoDB (connection strings criptografadas)
- Wizard step-by-step para migracao
- Selecao de collections com checkboxes
- Migracao por streams (sem baixar dump inteiro)
- Paralelismo configuravel (1 a 16 collections simultaneas)
- Batch size configuravel (500 a 10.000 docs por batch)
- Estrategia de conflito por collection (pular / sobrescrever / merge)
- Filtro de documentos (query JSON do MongoDB)
- Progresso em tempo real via SSE
- Validacao pos-migracao (contagem + amostragem)
- Historico completo de migracoes

## Pre-requisitos

- [Node.js](https://nodejs.org/) 22+
- [Rust](https://rustup.rs/) (rustc + cargo)
- Dependencias do sistema para Tauri (veja [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/))

## Setup

```bash
# 1. Instalar dependencias do frontend
npm install

# 2. Instalar dependencias do sidecar
cd sidecar && npm install && cd ..
```

## Desenvolvimento

### Opcao 1: Tauri completo (recomendado)

```bash
# Terminal 1: Sidecar
cd sidecar && npm run dev

# Terminal 2: Tauri + Frontend
npx tauri dev
```

### Opcao 2: Somente frontend (sem janela nativa)

```bash
# Terminal 1: Sidecar
cd sidecar && npm run dev

# Terminal 2: Frontend
npm run dev
```

Abra `http://localhost:5173` no browser.

## Build para Producao

```bash
npx tauri build
```

## Documentacao

Veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para entender a arquitetura completa, incluindo explicacao detalhada do codigo Rust linha por linha.

## Estrutura

```
├── src-tauri/      # Rust (Tauri) - bootstrap minimo
├── src/            # React frontend
├── sidecar/        # Node.js migration engine
└── docs/           # Documentacao
```
