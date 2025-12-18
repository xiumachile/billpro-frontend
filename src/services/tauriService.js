// src/services/tauriService.js
// Este servicio maneja la identificación del dispositivo de forma segura
// sin depender de APIs de Tauri que causan problemas en el entorno de desarrollo

// Función para obtener el hostname del navegador
export const getDeviceHostname = async () => {
  // En navegador, usar hostname del navegador
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  
  return 'unknown';
};

// Función para verificar si estamos en Tauri
export const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__;
};

// Función para obtener un identificador único del dispositivo
export const getDeviceIdentifier = async () => {
  let hostname = 'unknown';
  
  try {
    hostname = await getDeviceHostname();
  } catch (error) {
    console.error('Error al obtener hostname:', error);
  }
  
  // Crear un identificador único basado en el hostname
  if (isTauri()) {
    return `POS-${hostname.replace(/[^a-zA-Z0-9]/g, '-')}`;
  } else {
    return `WEB-${hostname.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }
};
