use tauri::Manager;
use printers::{get_printers, print};
use std::io::Write;
use std::net::TcpStream;

// OPCIÓN A: USB / DRIVER SISTEMA
#[tauri::command]
fn imprimir_ticket_sistema(impresora_nombre: String, contenido_base64: String) -> Result<String, String> {
    let bytes = base64::decode(&contenido_base64).map_err(|e| e.to_string())?;
    match print(&impresora_nombre, &bytes) {
        Ok(_) => Ok("Impreso por Sistema".to_string()),
        Err(e) => Err(format!("Error sistema: {}", e)),
    }
}

// OPCIÓN B: RED / IP DIRECTA
#[tauri::command]
fn imprimir_ticket_red(ip: String, puerto: String, contenido_base64: String) -> Result<String, String> {
    let bytes = base64::decode(&contenido_base64).map_err(|e| e.to_string())?;
    let address = format!("{}:{}", ip, puerto);
    
    // Conexión con timeout simple (Rust nativo bloquea, idealmente usar async o timeout)
    match TcpStream::connect(&address) {
        Ok(mut stream) => {
            if let Err(e) = stream.write_all(&bytes) {
                return Err(format!("Error enviando datos a {}: {}", address, e));
            }
            Ok("Impreso por Red".to_string())
        },
        Err(e) => Err(format!("No se pudo conectar a {}: {}", address, e))
    }
}

#[tauri::command]
fn listar_impresoras_sistema() -> Vec<String> {
    get_printers().into_iter().map(|p| p.name).collect()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            listar_impresoras_sistema,
            imprimir_ticket_sistema, // ✅ Registrada
            imprimir_ticket_red      // ✅ Registrada
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
