import React, { useEffect } from 'react';
import axios from '../api/axiosInstance';
import printerService from '../services/printerService';

export default function PrintMonitor() {
  
  useEffect(() => {
    // ⛔ IMPORTANTE: Este componente solo debe funcionar en la CAJA FÍSICA (Tauri)
    // Si es un navegador web (celular), no hace nada.
    if (!window.__TAURI__) return;

    console.log("🖨️ Servicio de Monitoreo de Impresión Iniciado...");

    // Consultar cada 5 segundos
    const interval = setInterval(chequearImpresiones, 5000); 
    
    return () => clearInterval(interval);
  }, []);

  const chequearImpresiones = async () => {
    try {
      // 1. Preguntar al VPS por trabajos pendientes
      const res = await axios.get('/impresion/pendientes');
      const trabajos = res.data.data || [];

      if (trabajos.length === 0) return;

      console.log(`🖨️ Se encontraron ${trabajos.length} tickets pendientes en la cola.`);

      // 2. Procesar cada trabajo secuencialmente
      for (const trabajo of trabajos) {
          try {
              console.log(`Processing Job #${trabajo.id} -> Zona: ${trabajo.zona}`);

              // Validar que venga el contenido JSON generado por el Backend
              if (!trabajo.contenido) {
                  console.warn(`⚠️ El trabajo #${trabajo.id} no tiene contenido JSON. Saltando.`);
                  // Opcional: Marcarlo como error para que no se trabe la cola
                  continue; 
              }

              // ✅ LÓGICA CORE: 
              // Usamos la función específica que lee el JSON del backend y manda a Rust.
              // trabajo.zona contiene el NOMBRE de la impresora (ej. "Cocina", "Barra")
              await printerService.imprimirComandaDesdeJson(trabajo.contenido, trabajo.zona);

              // 3. Confirmar al VPS que ya salió el papel
              await axios.post(`/impresion/marcar/${trabajo.id}`);
              
              console.log(`✅ Ticket #${trabajo.id} impreso y marcado como completado.`);

          } catch (err) {
              console.error(`❌ Error imprimiendo trabajo #${trabajo.id}:`, err);
              // No marcamos como impreso para que reintente en el siguiente ciclo 
              // (o podrías implementar un contador de reintentos en el backend)
          }
      }

    } catch (error) {
      // Errores de red o conexión silenciosos para no saturar consola
      if (error.code !== "ERR_NETWORK") {
          console.error("Error consultando cola de impresión:", error);
      }
    }
  };

  return null; // Componente invisible, trabaja en segundo plano
}
