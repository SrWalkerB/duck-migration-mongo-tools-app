// =====================================================
// Duck Migration - Tauri Backend (Rust)
//
// Este arquivo é o ponto de entrada do backend Rust do Tauri.
// Ele é responsável por:
//   1. Iniciar a janela do aplicativo
//   2. Registrar plugins (log, shell)
//   3. Spawnar o sidecar Node.js que faz toda a lógica de migração
//
// O Rust aqui é MÍNIMO - toda a lógica de negócio está no sidecar Node.js.
// O Tauri serve apenas como "container" para a janela nativa e para
// gerenciar o ciclo de vida do sidecar.
// =====================================================

/// Comando Tauri que retorna a porta do sidecar para o frontend.
/// O frontend usa essa porta para se comunicar via HTTP com o sidecar.
#[tauri::command]
fn get_sidecar_port() -> u16 {
    45678
}

/// Função principal que configura e inicia o aplicativo Tauri.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Plugin de log - mostra logs no console durante desenvolvimento
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        // Plugin de shell - permite spawnar processos (como o sidecar Node.js)
        .plugin(tauri_plugin_shell::init())
        // Registra comandos que o frontend pode chamar
        .invoke_handler(tauri::generate_handler![get_sidecar_port])
        // Setup - código que roda quando o app inicia
        .setup(|app| {
            let handle = app.handle().clone();

            // Spawna o sidecar Node.js em uma thread separada
            // O sidecar é um servidor HTTP que o frontend acessa via fetch
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::ShellExt;

                log::info!("Starting Duck Migration sidecar...");

                // O sidecar é executado via `node` rodando o servidor compilado
                // Em dev, usamos tsx para rodar TypeScript diretamente
                let result = handle
                    .shell()
                    .command("node")
                    .args(["--import", "tsx", "../sidecar/src/server.ts"])
                    .spawn();

                match result {
                    Ok((_rx, child)) => {
                        log::info!("Sidecar started with PID: {}", child.pid());
                    }
                    Err(e) => {
                        log::error!("Failed to start sidecar: {}", e);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
