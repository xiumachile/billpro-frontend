import React, { createContext, useContext, useState, useEffect } from 'react';
import cajaService from '../services/cajaService';

const CajaContext = createContext();

export const CajaProvider = ({ children, usuario }) => {
    // Estado Personal
    const [cajaAbierta, setCajaAbierta] = useState(false);
    const [datosSesion, setDatosSesion] = useState(null);
    
    // ✅ NUEVO: Estado Global (Para saber si otros tienen caja)
    const [sesionesGlobales, setSesionesGlobales] = useState([]); 
    
    const [loadingCaja, setLoadingCaja] = useState(true);

    // Función principal para consultar al servidor
    const verificarEstadoCaja = async () => {
        if (!usuario) {
            setCajaAbierta(false);
            setDatosSesion(null);
            setSesionesGlobales([]);
            setLoadingCaja(false);
            return;
        }

        try {
            setLoadingCaja(true);
            
            // ✅ HACEMOS DOS PETICIONES EN PARALELO:
            // 1. Mi estado personal
            // 2. El estado de todo el local
            const [resPersonal, resGlobal] = await Promise.all([
                cajaService.getEstadoUsuario(),
                cajaService.getSesionesActivas().catch(() => ({ data: [] })) // Evitar crash si falla
            ]);
            
            // 1. Procesar mi estado
            if (resPersonal.estado === 'abierta') {
                setCajaAbierta(true);
                setDatosSesion(resPersonal.data);
            } else {
                setCajaAbierta(false);
                setDatosSesion(null);
            }

            // 2. Procesar estado global
            setSesionesGlobales(Array.isArray(resGlobal.data) ? resGlobal.data : []);

        } catch (error) {
            console.error("Error verificando caja:", error);
            setCajaAbierta(false);
        } finally {
            setLoadingCaja(false);
        }
    };

    // Ejecutar verificación cuando cambia el usuario
    useEffect(() => {
        verificarEstadoCaja();
    }, [usuario]);

    const notificarApertura = (datos) => {
        setCajaAbierta(true);
        setDatosSesion(datos);
        verificarEstadoCaja(); // Refrescar globales también
    };

    const notificarCierre = () => {
        setCajaAbierta(false);
        setDatosSesion(null);
        verificarEstadoCaja(); // Refrescar globales también
    };

    return (
        <CajaContext.Provider value={{
            cajaAbierta,
            datosSesion,
            sesionesGlobales, // ✅ Exportamos esto
            loadingCaja,
            verificarEstadoCaja,
            notificarApertura,
            notificarCierre
        }}>
            {children}
        </CajaContext.Provider>
    );
};

export const useCaja = () => {
    return useContext(CajaContext);
};
