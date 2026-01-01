import { v4 as uuidv4 } from 'uuid';

export const getTerminalId = () => {
    let uuid = localStorage.getItem('device_uuid');
    
    if (!uuid) {
        // Generamos uno nuevo y lo guardamos "para siempre"
        uuid = uuidv4();
        localStorage.setItem('device_uuid', uuid);
    }
    
    return uuid;
};

export const getDeviceType = () => {
    // Detectar si es Tauri o Web/Mobile
    const isTauri = window.__TAURI_INTERNALS__;
    if (isTauri) return 'desktop';
    return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
};
