# Duck Migration - Arquitetura

Este documento explica em detalhes como o projeto funciona, arquivo por arquivo.
Feito especialmente para quem **não sabe Rust** poder entender tudo.

---

## Visao Geral

O Duck Migration eh composto por 3 camadas:

```
┌──────────────────────────────────────────────────────┐
│                    TAURI (Rust)                       │
│  Cria a janela nativa do app e spawna o sidecar      │
│                                                      │
│  ┌────────────────────┐  ┌─────────────────────────┐ │
│  │   React Frontend   │  │    Node.js Sidecar      │ │
│  │   (o que vc ve)    │  │    (logica pesada)      │ │
│  │                    │  │                         │ │
│  │   - UI/Wizard      │  │  - MongoDB driver       │ │
│  │   - Tailwind CSS   │  │  - Migracao             │ │
│  │   - Componentes    │  │  - SQLite               │ │
│  └────────┬───────────┘  └──────────┬──────────────┘ │
│           │                         │                │
│           └────── HTTP/SSE ─────────┘                │
└──────────────────────────────────────────────────────┘
```

### Como funciona a comunicacao:

1. O **Tauri** (Rust) abre uma janela nativa e carrega o React (como um browser embutido)
2. O **Tauri** tambem spawna o **Sidecar** (um servidor Node.js rodando na porta 45678)
3. O **React** faz chamadas HTTP para o **Sidecar** (como se fosse uma API REST)
4. O **Sidecar** faz toda a logica pesada: conectar no MongoDB, migrar dados, salvar historico
5. O **Sidecar** envia progresso em tempo real via **SSE** (Server-Sent Events)

---

## Estrutura de Pastas

```
duck-migration-mongo-tools/
│
├── src-tauri/          # RUST - Codigo do Tauri (minimo, so bootstrap)
├── src/                # REACT - Frontend (TypeScript + Tailwind)
├── sidecar/            # NODE.JS - Servidor de migracao (TypeScript)
├── docs/               # Documentacao
└── package.json        # Dependencias do React
```

---

## PARTE 1: Tauri (Rust) - src-tauri/

> **Voce NAO precisa saber Rust para usar este projeto.**
> O Rust aqui eh minimo - so 2 arquivos com ~50 linhas no total.
> O Tauri gera a maioria do codigo automaticamente.

### src-tauri/Cargo.toml

Este eh o `package.json` do Rust. Define as dependencias:

```toml
[dependencies]
tauri = { version = "2.10.3" }      # Framework para criar apps desktop
tauri-plugin-log = "2"               # Plugin para mostrar logs no console
tauri-plugin-shell = "2"             # Plugin para spawnar processos (o sidecar)
serde = { version = "1.0" }         # Serializacao de dados (Rust precisa disso)
serde_json = "1.0"                   # JSON parser para Rust
log = "0.4"                          # Logging
```

### src-tauri/src/main.rs

Ponto de entrada. So chama a funcao `run()`:

```rust
// Esta linha esconde o terminal no Windows quando o app eh compilado
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();  // Chama a funcao run() definida em lib.rs
}
```

### src-tauri/src/lib.rs

O coracao do Tauri. Vou explicar linha por linha:

```rust
// Este "comando" eh uma funcao que o React pode chamar via JavaScript.
// Retorna a porta do sidecar para o frontend saber onde conectar.
#[tauri::command]     // <-- Macro que registra como comando Tauri
fn get_sidecar_port() -> u16 {
    45678             // <-- Porta fixa do sidecar
}

// Funcao principal que configura e inicia o app
pub fn run() {
    tauri::Builder::default()

        // 1. Registra o plugin de LOG (mostra mensagens no terminal)
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)    // So mostra logs nivel Info+
            .build())

        // 2. Registra o plugin de SHELL (permite spawnar processos)
        .plugin(tauri_plugin_shell::init())

        // 3. Registra os "comandos" que o React pode chamar
        .invoke_handler(tauri::generate_handler![get_sidecar_port])

        // 4. SETUP - codigo que roda quando o app inicia
        .setup(|app| {
            let handle = app.handle().clone();

            // Spawna o sidecar em uma thread separada (nao trava a UI)
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::ShellExt;

                // Executa: node --import tsx ../sidecar/src/server.ts
                let result = handle
                    .shell()
                    .command("node")
                    .args(["--import", "tsx", "../sidecar/src/server.ts"])
                    .spawn();

                match result {
                    Ok((_rx, child)) => {
                        // Sucesso! Mostra o PID do processo
                        log::info!("Sidecar started with PID: {}", child.pid());
                    }
                    Err(e) => {
                        // Falhou - mostra o erro
                        log::error!("Failed to start sidecar: {}", e);
                    }
                }
            });

            Ok(())
        })

        // 5. Inicia o app (abre a janela)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Resumo do Rust:** Ele so abre a janela e executa `node sidecar/src/server.ts`. Nada mais.

### src-tauri/tauri.conf.json

Configuracao do app:
- `productName`: Nome que aparece na barra de titulo
- `build.devUrl`: URL do Vite em dev (localhost:5173)
- `build.beforeDevCommand`: Comando para iniciar o Vite
- `app.windows`: Configuracao da janela (tamanho, titulo)
- `bundle`: Configuracao de build para distribuicao

### src-tauri/capabilities/default.json

Permissoes de seguranca. Define o que o app pode fazer:
- `core:default` - Permissoes basicas do Tauri
- `shell:allow-spawn` - Permite spawnar processos (necessario para o sidecar)

---

## PARTE 2: Sidecar Node.js - sidecar/

O sidecar eh um servidor HTTP que roda localmente. Eh onde toda a logica de migracao acontece.

### sidecar/src/server.ts

Ponto de entrada do sidecar. Configura e inicia o Fastify (framework HTTP):

1. Inicializa o SQLite (banco local para salvar conexoes e historico)
2. Registra o CORS (permite o React chamar a API)
3. Registra as rotas (connections, migration, history)
4. Configura graceful shutdown (fecha conexoes MongoDB e SQLite ao sair)
5. Inicia na porta 45678

### sidecar/src/types/index.ts

Define todos os tipos TypeScript usados no sidecar:
- `ConnectionConfig` - Dados de uma conexao MongoDB
- `MigrationRequest` - Requisicao de migracao
- `MigrationProgress` - Progresso de uma migracao em andamento
- `CollectionProgress` - Progresso de uma collection sendo migrada
- `ValidationResult` - Resultado da validacao pos-migracao
- `MigrationHistory` - Registro historico de uma migracao
- `SSEEvent` - Tipos de eventos enviados via Server-Sent Events

### sidecar/src/services/database.ts

Servico de persistencia com SQLite:

**Criptografia:**
- Connection strings sao criptografadas com AES-256-CBC antes de salvar
- Usa `crypto` nativo do Node.js
- Chave derivada com `scrypt`

**Tabelas:**
- `connections` - Armazena conexoes MongoDB (id, nome, connection_string criptografada)
- `migration_history` - Historico de migracoes (origem, destino, status, duracao)

**Funcoes:**
- `initDatabase()` - Cria as tabelas se nao existirem
- `createConnection()` / `getAllConnections()` / `updateConnection()` / `deleteConnection()` - CRUD
- `saveMigrationHistory()` / `getAllMigrationHistory()` - Historico

### sidecar/src/services/mongo.ts

Servico de conexao com MongoDB:

- `getClient()` - Retorna um MongoClient. Usa cache para reutilizar conexoes
- `testConnection()` - Testa se uma connection string funciona (faz ping)
- `listDatabases()` - Lista todos os databases (exceto admin, local, config)
- `listCollections()` - Lista collections de um database com metadados (contagem, tamanho)
- `closeAllConnections()` - Fecha todas as conexoes ativas

### sidecar/src/services/migrator.ts

**O coracao da migracao.** Logica principal:

**`executeMigration(request)`:**
1. Busca as conexoes de origem e destino no SQLite
2. Conecta em ambos os MongoDB
3. Conta documentos de cada collection
4. Processa collections em lotes paralelos (ex: 4 por vez)
5. Emite eventos SSE de progresso
6. Salva o resultado no historico

**`migrateCollection()`:**
1. Verifica se a collection ja existe no destino
2. Aplica a estrategia de conflito:
   - **skip**: Pula a collection (nao faz nada)
   - **overwrite**: Apaga a collection no destino e recria
   - **merge**: Insere somente documentos novos (por _id)
3. Abre um cursor stream na collection de origem (`find().stream()`)
4. Le documentos um a um e agrupa em batches
5. Insere cada batch no destino via `insertMany()`
6. Atualiza o progresso (docs migrados, velocidade, tempo restante)

**Batch de insercao:**
- No modo normal: `insertMany(docs, { ordered: true })` - para no primeiro erro
- No modo merge: `insertMany(docs, { ordered: false })` - ignora erros de _id duplicado

### sidecar/src/services/validator.ts

Validacao pos-migracao:

1. **Contagem**: Compara `countDocuments()` na origem vs destino
2. **Amostragem**: Pega 100 documentos aleatorios da origem (`$sample`) e verifica se existem no destino
3. Emite resultados via SSE

### sidecar/src/events/sse.ts

Server-Sent Events para progresso em tempo real:

- `addSSEClient()` - Registra um novo cliente (o React abre uma conexao SSE)
- `emitSSE()` - Envia um evento para todos os clientes conectados
- Tipos de eventos:
  - `migration:start` - Migracao iniciou
  - `migration:progress` - Progresso de uma collection
  - `migration:collection:complete` - Collection concluida
  - `migration:complete` - Migracao inteira concluida
  - `migration:error` - Erro durante migracao
  - `validation:result` - Resultado de validacao

### sidecar/src/routes/connections.ts

Rotas REST para gerenciar conexoes:

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/connections | Lista todas as conexoes |
| POST | /api/connections | Cria nova conexao |
| GET | /api/connections/:id | Busca conexao por ID |
| PUT | /api/connections/:id | Atualiza conexao |
| DELETE | /api/connections/:id | Deleta conexao |
| POST | /api/connections/:id/test | Testa conexao salva |
| POST | /api/connections/test | Testa connection string diretamente |
| GET | /api/connections/:id/databases | Lista databases |
| GET | /api/connections/:id/databases/:db/collections | Lista collections |

### sidecar/src/routes/migration.ts

Rotas de migracao:

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/migration/events | SSE - progresso em tempo real |
| POST | /api/migration/start | Inicia migracao |
| GET | /api/migration/status | Status da migracao ativa |
| POST | /api/migration/cancel | Cancela migracao |
| POST | /api/migration/validate | Valida migracao |

### sidecar/src/routes/history.ts

Rotas de historico:

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/history | Lista todo o historico |
| GET | /api/history/:id | Detalhes de uma migracao |

---

## PARTE 3: React Frontend - src/

### Estrutura

```
src/
├── components/
│   ├── ui/             # Componentes reutilizaveis (Button, Input, Card, etc.)
│   ├── wizard/         # Steps do wizard de migracao
│   ├── connections/    # Gerenciamento de conexoes
│   ├── history/        # Historico de migracoes
│   └── layout/         # Layout principal (Sidebar + conteudo)
├── hooks/              # React hooks customizados
├── services/           # API client (comunicacao com sidecar)
├── types/              # Tipos TypeScript
└── lib/                # Utilitarios (cn, formatBytes, etc.)
```

### src/services/api.ts

Cliente HTTP para o sidecar. Todas as chamadas fetch para `http://127.0.0.1:45678`.
Tambem cria a conexao SSE para receber progresso em tempo real.

### src/hooks/

- `useConnections.ts` - CRUD de conexoes com estado
- `useMigration.ts` - Controla migracao ativa, SSE, validacao
- `useWizard.ts` - Estado do wizard (step atual, dados selecionados)

### src/components/wizard/

O wizard tem 6 steps:

1. **StepSelectSource** - Seleciona conexao e database de origem
2. **StepSelectTarget** - Seleciona conexao e database de destino
3. **StepSelectCollections** - Checkboxes para escolher collections
4. **StepConfigure** - Batch size, paralelismo, estrategia de conflito, filtro
5. **StepReview** - Resumo antes de executar
6. **StepExecute** - Execucao com progresso em tempo real

### src/components/ui/

Componentes UI base: Button, Input, Select, Checkbox, Card, Badge, ProgressBar, Spinner, Alert.
Todos usam Tailwind CSS com o tema escuro definido em `index.css`.

---

## Como Rodar em Desenvolvimento

### Pre-requisitos:
- Node.js 22+
- Rust (rustc + cargo)
- Tauri CLI

### Passos:

1. Instalar dependencias do frontend:
```bash
npm install
```

2. Instalar dependencias do sidecar:
```bash
cd sidecar && npm install
```

3. Iniciar o sidecar separadamente (em um terminal):
```bash
cd sidecar && npm run dev
```

4. Iniciar o Tauri (em outro terminal):
```bash
npx tauri dev
```

Ou iniciar so o frontend (sem Tauri):
```bash
npm run dev
```

---

## Como a Migracao Funciona Internamente

```
Passo 1: Usuario clica "Start Migration"
    │
    ▼
Passo 2: Frontend envia POST /api/migration/start
    │
    ▼
Passo 3: Sidecar conecta no MongoDB origem e destino
    │
    ▼
Passo 4: Para cada collection (em paralelo, ex: 4 por vez):
    │
    ├── 4a. Verifica se collection existe no destino
    │       → skip: pula
    │       → overwrite: DROP + recria
    │       → merge: insere so os novos
    │
    ├── 4b. Abre cursor stream na origem
    │       sourceCollection.find(filter)
    │
    ├── 4c. Le documentos do cursor em batches (ex: 1000)
    │
    ├── 4d. Insere batch no destino
    │       targetCollection.insertMany(batch)
    │
    ├── 4e. Atualiza progresso e emite via SSE
    │       → Frontend atualiza barra de progresso
    │
    └── 4f. Repete 4c-4e ate acabar todos os documentos
    │
    ▼
Passo 5: Salva resultado no historico (SQLite)
    │
    ▼
Passo 6: Usuario pode clicar "Validar" para comparar origem vs destino
```

---

## Glossario

- **Tauri**: Framework para criar apps desktop usando web tech (HTML/CSS/JS) com backend Rust
- **Sidecar**: Processo secundario que roda ao lado do app principal
- **Fastify**: Framework HTTP rapido para Node.js (alternativa ao Express)
- **SSE**: Server-Sent Events - protocolo para o servidor enviar dados em tempo real para o browser
- **Cursor Stream**: Forma de ler documentos do MongoDB um por um sem carregar tudo na memoria
- **insertMany**: Funcao do MongoDB para inserir varios documentos de uma vez
- **SQLite**: Banco de dados local em arquivo (nao precisa de servidor)
- **WAL mode**: Modo de escrita do SQLite que permite leitura e escrita simultaneas
