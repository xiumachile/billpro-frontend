import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, LogOut, Eraser, X, Utensils, Clock, DollarSign, Printer, Eye, FileText,
  Wallet, PieChart, Home, Users, Smartphone // ✅ 1. IMPORTADO SMARTPHONE
} from 'lucide-react';

// IMPORTACIONES DE CONTEXTO Y MODALES
import { useCaja } from '../context/CajaContext';
import AperturaCajaModal from './caja/AperturaCajaModal';
import CierreCajaModal from './caja/CierreCajaModal';
import MovimientoCajaModal from './caja/MovimientoCajaModal';

export default function Dashboard({ onLogout, usuario: usuarioProp }) {
  const navigate = useNavigate();
  
  // --- ESTADOS DATOS ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [usuario, setUsuario] = useState(null);

  // --- HOOKS DE CAJA ---
  const { cajaAbierta, loadingCaja, sesionesGlobales } = useCaja();
  
  // --- MODALES ---
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);

  // Cargar usuario
  useEffect(() => {
    if (usuarioProp) {
      setUsuario(usuarioProp);
    } else {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        try {
          setUsuario(JSON.parse(usuarioGuardado));
        } catch (e) {
          console.error('Error al parsear usuario:', e);
        }
      }
    }
  }, [usuarioProp]);

  // Reloj
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Navegación
  const goToModule = (module) => {
    switch(module) {
      case 'mesas': navigate('/gestion-mesas'); break;
      case 'parametros': navigate('/parametros'); break;
      case 'usuarios': navigate('/usuarios'); break;
      case 'reportes': navigate('/reportes'); break;
      case 'gastos': navigate('/finanzas/gastos'); break;
      case 'balance': navigate('/finanzas/balance'); break;
      case 'carta': navigate('/carta'); break;
      case 'inventario': navigate('/inventario'); break;
      case 'clientes': navigate('/clientes'); break;
      case 'delivery': navigate('/delivery'); break;
      case 'paralleva': navigate('/para-llevar'); break;
      case 'reimprimir': navigate('/reimprimir'); break;
      case 'app_pedidos': navigate('/pedidos-app'); break; // ✅ Nueva ruta
      default: console.log('Navegando a:', module);
    }
  };

  // --- SEGURIDAD ---
  const tieneRol = (nombreRol) => {
    if (!usuario || !usuario.roles || usuario.roles.length === 0) return false;
    return usuario.roles.some(rol => {
      const rolNombre = rol.nombre || rol.name || '';
      return rolNombre.toLowerCase() === nombreRol.toLowerCase();
    });
  };

  const puedeGestionarCaja = () => {
    return tieneRol('dueño') || tieneRol('admin') || tieneRol('administrador') || tieneRol('cajero');
  };

  // --- LÓGICA VISUAL DE CAJA ---
  const hayCajaGlobal = sesionesGlobales && sesionesGlobales.length > 0;
  const nombreCajeroGlobal = hayCajaGlobal ? (sesionesGlobales[0].usuario || 'Otro') : '';
  const mostrarAlertaApertura = !loadingCaja && !cajaAbierta && !hayCajaGlobal && puedeGestionarCaja();

  // --- CONFIGURACIÓN DE BOTONES (Sin Traducción) ---
  const todosLosBotones = [
    { name: 'Salir', icon: '🚪', action: onLogout, roles: ['todos'] },
    { name: 'Reimprimir', icon: '🧾', action: () => goToModule('reimprimir'), roles: ['dueño', 'admin', 'administrador', 'cajero'] },
    { name: 'Reportes', icon: '📈', action: () => goToModule('reportes'), roles: ['dueño', 'admin', 'administrador'] },
    
    // Finanzas
    { name: 'Gastos', icon: <Wallet className="w-10 h-10 text-gray-600"/>, action: () => goToModule('gastos'), roles: ['dueño', 'admin', 'administrador'] },
    { name: 'Balance', icon: <PieChart className="w-10 h-10 text-gray-600"/>, action: () => goToModule('balance'), roles: ['dueño', 'admin', 'administrador'] },

    // Gestión
    { name: 'Carta', icon: '📖', action: () => goToModule('carta'), roles: ['dueño', 'admin', 'administrador'] },
    { name: 'Inventario', icon: '📦', action: () => goToModule('inventario'), roles: ['dueño', 'admin', 'administrador'] },
    { name: 'Clientes', icon: '👥', action: () => goToModule('clientes'), roles: ['dueño', 'admin', 'administrador', 'cajero', 'mozo'] },
    { name: 'Ajustes', icon: '⚙️', action: () => goToModule('parametros'), roles: ['dueño', 'admin', 'administrador'] },
    { name: 'Usuarios', icon: '👤', action: () => goToModule('usuarios'), roles: ['dueño', 'admin', 'administrador'] },
    
    // Operación
    { name: 'Delivery', icon: '🛵', action: () => goToModule('delivery'), roles: ['todos'] },
    { name: 'Para Llevar', icon: '🥡', action: () => goToModule('paralleva'), roles: ['todos'] },
    
    // ✅ 2. BOTÓN PEDIDO APP
    { name: 'Pedido APP', icon: <Smartphone className="w-10 h-10 text-gray-600"/>, action: () => goToModule('app_pedidos'), roles: ['todos'] },

    { name: 'Mesas', icon: '🍽️', action: () => goToModule('mesas'), roles: ['todos'] },
  ];

  const menuButtons = todosLosBotones.filter(boton => {
    if (boton.roles.includes('todos')) return true;
    return boton.roles.some(rol => tieneRol(rol));
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif', padding: '10px',
    }}>
      
      {/* HEADER */}
      <div style={{
        backgroundColor: '#ffffff', padding: '12px 20px', borderRadius: '8px',
        marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Usuario */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            Usuario: {usuario?.nombre_completo || 'Desconocido'}
          </span>
          <span style={{ fontSize: '14px', padding: '4px 12px', backgroundColor: '#e3f2fd', borderRadius: '12px', color: '#1976d2', fontWeight: '500' }}>
            {usuario?.roles?.[0]?.nombre || 'Sin rol'}
          </span>
        </div>

        {/* Caja & Hora */}
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666', alignItems: 'center' }}>
          
          <div style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px', borderRadius: '6px',
              backgroundColor: cajaAbierta ? '#e8f5e9' : (hayCajaGlobal ? '#e3f2fd' : '#ffebee'),
              border: `1px solid ${cajaAbierta ? '#c8e6c9' : (hayCajaGlobal ? '#bbdefb' : '#ffcdd2')}`
          }}>
             <span style={{ color: cajaAbierta ? '#2e7d32' : (hayCajaGlobal ? '#1565c0' : '#c62828'), fontWeight: 'bold', marginRight: '5px' }}>
                {cajaAbierta 
                    ? 'MI CAJA ABIERTA' 
                    : (hayCajaGlobal ? `CAJA ABIERTA POR ${nombreCajeroGlobal}` : 'CAJA CERRADA')
                }
             </span>

             {cajaAbierta && puedeGestionarCaja() && (
                 <>
                    <button onClick={() => setShowMovimientoModal(true)} style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: '#f57f17', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                         MOVIMIENTO
                     </button>
                     <button onClick={() => setShowCierreModal(true)} style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                         CERRAR TURNO
                     </button>
                 </>
             )}

             {!cajaAbierta && hayCajaGlobal && puedeGestionarCaja() && (
                <button onClick={() => setShowAperturaModal(true)} style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#fff', border: '1px solid #2196f3', color: '#2196f3', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ABRIR OTRA
                </button>
             )}
          </div>

          <span>POS #01</span>
          <span>Hora: {currentTime.toLocaleTimeString('es-CL')}</span>
        </div>
      </div>

      {/* ALERTA CAJA CERRADA */}
      {mostrarAlertaApertura && (
        <div style={{
          backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px',
          padding: '15px 20px', marginBottom: '20px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, color: '#856404', fontSize: '16px' }}>¡LOCAL CERRADO!</h3>
              <p style={{ margin: 0, color: '#856404', fontSize: '13px' }}>No hay ninguna caja abierta. Debes abrir caja para comenzar a vender.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAperturaModal(true)}
            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            ABRIR CAJA AHORA
          </button>
        </div>
      )}

      {/* GRID BOTONES */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '12px', marginBottom: '20px', backgroundColor: '#ffffff',
        padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {menuButtons.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '120px', backgroundColor: '#ffffff', border: '2px solid #e0e0e0',
              borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              textAlign: 'center', padding: '12px 8px', transition: 'all 0.2s ease', color: '#333',
            }}
          >
            <span style={{ fontSize: '38px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeof item.icon === 'string' ? item.icon : item.icon}
            </span>
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      {/* LOGO */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '30px 40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
          <h1 style={{ color: '#d32f2f', fontSize: '72px', fontWeight: 'bold', margin: '0', letterSpacing: '2px' }}>
            RESTOBAR
          </h1>
          <p style={{ fontSize: '24px', color: '#666', margin: '10px 0 0 0', fontWeight: '300' }}>
            Punto de Venta
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ backgroundColor: '#ffffff', padding: '12px', textAlign: 'center', fontSize: '13px', color: '#999', borderTop: '1px solid #e0e0e0', borderRadius: '8px' }}>
        © 2025 Sistema POS. Todos los derechos reservados.
      </div>

      {/* MODALES */}
      <AperturaCajaModal isOpen={showAperturaModal} onClose={() => setShowAperturaModal(false)} />
      <CierreCajaModal isOpen={showCierreModal} onClose={() => setShowCierreModal(false)} />
      <MovimientoCajaModal isOpen={showMovimientoModal} onClose={() => setShowMovimientoModal(false)} />

    </div>
  );
}
