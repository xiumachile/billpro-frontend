#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use printers::{get_printers, get_printer_by_name};
use printers::common::base::job::PrinterJobOptions; 
use base64::{Engine as _, engine::general_purpose};

#[tauri::command]
fn obtener_impresoras() -> Vec<String> {
    get_printers()
        .into_iter()
        .map(|p| p.name.clone())
        .collect()
}

#[tauri::command]
fn imprimir_ticket(impresora: String, contenido_base64: String) -> Result<String, String> {
    let bytes = general_purpose::STANDARD
        .decode(&contenido_base64)
        .map_err(|e| format!("Error decodificando Base64: {}", e))?;

    let printer = get_printer_by_name(&impresora)
        .ok_or_else(|| format!("Impresora '{}' no encontrada", impresora))?;

    // ✅ CORRECCIÓN: name es Option<&str> y raw_properties es &[(&str, &str)]
    let options = PrinterJobOptions { 
        name: Some("Ticket Venta"),
        raw_properties: &[]  // slice vacío
    };
    
    printer.print(&bytes, options)
        .map_err(|e| format!("Error al imprimir: {}", e))?;

    Ok("Impreso correctamente".to_string())
}

#[tauri::command]
fn abrir_cajon(impresora: String) -> Result<String, String> {
    let codigo_apertura = vec![27, 112, 0, 25, 250]; 
    
    let printer = get_printer_by_name(&impresora)
        .ok_or_else(|| format!("Impresora '{}' no encontrada", impresora))?;

    // ✅ CORRECCIÓN: Lo mismo aquí
    let options = PrinterJobOptions { 
        name: Some("Abrir Cajon"),
        raw_properties: &[]  // slice vacío
    };
    
    printer.print(&codigo_apertura, options)
        .map_err(|e| format!("Error abriendo cajón: {}", e))?;

    Ok("Cajón abierto".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            obtener_impresoras, 
            imprimir_ticket,
            abrir_cajon
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
