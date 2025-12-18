import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// --- CONTEXTOS ---
import { CajaProvider } from './context/CajaContext';
import { LanguageProvider } from './context/LanguageContext';

// --- COMPONENTES PRINCIPALES ---
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import GestionMesas from './components/GestionMesas';
// ❌ ELIMINADO: import Pedido from './components/Pedido'; (Ya no se usa)
import Clientes from './components/Clientes';
import FormularioCliente from './components/FormularioCliente';
import CartaManager from './components/CartaManager';
import PermissionRoute from './components/PermissionRoute';

// --- MÓDULOS DE PEDIDO ---
import DeliveryManager from './components/pedido/DeliveryManager';
import TakeOutManager from './components/pedido/TakeOutManager';
import MesaManager from './components/pedido/MesaManager';
import ReimprimirManager from './components/pedido/ReimprimirManager';
import AppPedidoManager from './components/pedido/AppPedidoManager';

// --- INVENTARIO Y COMPRAS ---
import InventarioManager from './components/inventario/InventarioManager';
import ProveedoresManager from './components/inventario/ProveedoresManager';
import ComprasManager from './components/inventario/ComprasManager';
import CompraForm from './components/inventario/CompraForm';
import RecetaProductoInventarioManager from './components/inventario/RecetaProductoInventarioManager';
import ReporteProduccion from './components/inventario/ReporteProduccion';

// --- REPORTES Y FINANZAS ---
import ReportesVentas from './components/reportes/ReportesVentas';
import GastosManager from './components/finanzas/GastosManager';
import ReporteFinanciero from './components/finanzas/ReporteFinanciero';

// --- CAJA ---
import HistorialCajas from './components/caja/HistorialCajas';

// --- PARÁMETROS Y CONFIGURACIÓN ---
import Parametros from './components/Parametros/Parametros';
import GestionUsuarios from './components/Parametros/GestionUsuarios';
import ConfiguracionTickets from './components/Parametros/ConfiguracionTickets';
import ConfiguracionImpresoras from './components/Parametros/ConfiguracionImpresoras';
import ConfiguracionRed from './components/Parametros/ConfiguracionRed';
import ConfiguracionComandas from './components/Parametros/ConfiguracionComandas';
import ConfiguracionCajas from './components/Parametros/ConfiguracionCajas';
import ConfiguracionApps from './components/Parametros/ConfiguracionApps';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const usuarioInfo = JSON.parse(localStorage.getItem('usuarioInfo'));
        setUsuario(usuarioInfo);
      } catch (e) {
        console.error('Error al parsear usuarioInfo:', e);
        handleLogout();
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUsuario(userData.usuario);
    localStorage.setItem('token', userData.access_token);
    localStorage.setItem('usuarioInfo', JSON.stringify(userData.usuario));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioInfo');
    setUsuario(null);
    setIsLoggedIn(false);
  };

  // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
  const getRutaInicial = (usr) => {
      if (!usr || !usr.roles) return "/"; 
      const roles = usr.roles.map(r => (r.name || r.nombre || "").toLowerCase());
      
      if (roles.includes("mozo") || roles.includes("cajero")) return "/gestion-mesas";
      
      const bloqueoActivo = localStorage.getItem('config_bloqueo_terminal') === 'true';
      if (bloqueoActivo) return "/gestion-mesas";

      return "/"; 
  };

  // --- WRAPPERS ---
  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    return children;
  };

  const PublicOnlyRoute = ({ children }) => {
    if (isLoggedIn && usuario) return <Navigate to={getRutaInicial(usuario)} replace />;
    return children;
  };

  // Wrappers de Navegación
  const ReportesWrapper = () => { const navigate = useNavigate(); return <ProtectedRoute><ReportesVentas usuario={usuario} onVolver={() => navigate('/')} /></ProtectedRoute>; };
  const InventarioWrapper = () => { const navigate = useNavigate(); return <ProtectedRoute><PermissionRoute requiredPermission="view-inventario"><InventarioManager usuario={usuario} onVolver={() => navigate('/')} /></PermissionRoute></ProtectedRoute>; };
  const CartaWrapper = () => { const navigate = useNavigate(); return <ProtectedRoute><PermissionRoute requiredPermission="manage_menu"><CartaManager usuario={usuario} onVolver={() => navigate('/')} /></PermissionRoute></ProtectedRoute>; };
  const DeliveryWrapper = () => { const navigate = useNavigate(); return <ProtectedRoute><DeliveryManager usuario={usuario} onVolver={() => navigate('/')} /></ProtectedRoute>; };
  const TakeOutWrapper = () => { const navigate = useNavigate(); return <ProtectedRoute><TakeOutManager usuario={usuario} onVolver={() => navigate('/')} /></ProtectedRoute>; };
  const MesaWrapper = () => { const navigate = useNavigate(); return <ProtectedRoute><MesaManager usuario={usuario} onVolver={() => navigate('/')} /></ProtectedRoute>; };

  return (
    <Router>
      <LanguageProvider>
        <CajaProvider usuario={usuario}>
          <div className="App">
            <Routes>
              {/* === PÚBLICAS === */}
              <Route path="/login" element={<PublicOnlyRoute><LoginScreen onLoginSuccess={handleLoginSuccess} /></PublicOnlyRoute>} />

              {/* === DASHBOARD === */}
              <Route path="/" element={<ProtectedRoute><Dashboard usuario={usuario} onLogout={handleLogout} /></ProtectedRoute>} />

              {/* === OPERACIÓN DIARIA === */}
              <Route path="/gestion-mesas" element={<ProtectedRoute><GestionMesas usuario={usuario} /></ProtectedRoute>} />
              <Route path="/delivery" element={<DeliveryWrapper />} />
              <Route path="/para-llevar" element={<TakeOutWrapper />} />
              <Route path="/mesas" element={<MesaWrapper />} />

              {/* ❌ RUTAS DE 'PEDIDO' ELIMINADAS PORQUE YA USAMOS MODALES */}
              {/* <Route path="/pedido/nuevo" ... /> */}
              
              {/* Reimprimir */}
              <Route path="/reimprimir" element={<ProtectedRoute><ReimprimirManager /></ProtectedRoute>} />

              {/* Módulo Apps Delivery */}
              <Route path="/pedidos-app" element={<ProtectedRoute><AppPedidoManager usuario={usuario}/></ProtectedRoute>} />

              {/* === REPORTES Y FINANZAS === */}
              <Route path="/reportes" element={<ReportesWrapper />} />
              <Route path="/finanzas/gastos" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-compras"><GastosManager /></PermissionRoute></ProtectedRoute>} />
              <Route path="/finanzas/balance" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-compras"><ReporteFinanciero /></PermissionRoute></ProtectedRoute>} />

              {/* === CAJA === */}
              <Route path="/caja/historial" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-users"><HistorialCajas /></PermissionRoute></ProtectedRoute>} />

              {/* === CLIENTES === */}
              <Route path="/clientes" element={<ProtectedRoute><PermissionRoute requiredPermission="ver-clientes"><Clientes usuario={usuario} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/clientes/nuevo" element={<ProtectedRoute><PermissionRoute requiredPermission="crear-clientes"><FormularioCliente usuario={usuario} esEdicion={false} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/clientes/editar/:id" element={<ProtectedRoute><PermissionRoute requiredPermission="editar-clientes"><FormularioCliente usuario={usuario} esEdicion={true} /></PermissionRoute></ProtectedRoute>} />

              {/* === INVENTARIO Y COMPRAS === */}
              <Route path="/inventario" element={<InventarioWrapper />} />
              <Route path="/inventario/proveedores" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-proveedores"><ProveedoresManager usuario={usuario} onVolver={() => window.history.back()} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/inventario/compras" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-compras"><ComprasManager usuario={usuario} onVolver={() => window.history.back()} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/inventario/compras/nueva" element={<ProtectedRoute><PermissionRoute requiredPermission="create-compras"><CompraForm usuario={usuario} onVolver={() => window.history.back()} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/inventario/compras/:id/editar" element={<ProtectedRoute><PermissionRoute requiredPermission="create-compras"><CompraForm usuario={usuario} onVolver={() => window.history.back()} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/inventario/recetas-producto-inventario" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-inventario"><RecetaProductoInventarioManager usuario={usuario} onVolver={() => window.history.back()} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/reportes/produccion" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-inventario"><ReporteProduccion usuario={usuario} onVolver={() => window.history.back()} /></PermissionRoute></ProtectedRoute>} />

              {/* === GESTIÓN DE CARTA === */}
              <Route path="/carta" element={<CartaWrapper />} />

              {/* === PARÁMETROS Y CONFIGURACIÓN === */}
              <Route path="/parametros/*" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-users"><Parametros usuario={usuario} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/parametros/cajas" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-users"><ConfiguracionCajas /></PermissionRoute></ProtectedRoute>} />
              <Route path="/parametros/apps" element={<ProtectedRoute><ConfiguracionApps /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-users"><GestionUsuarios usuario={usuario} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/parametros/tickets" element={<ProtectedRoute><PermissionRoute requiredPermission="view-configuracion-tickets"><ConfiguracionTickets usuario={usuario} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/parametros/impresoras" element={<ProtectedRoute><PermissionRoute requiredPermission="view-impresoras"><ConfiguracionImpresoras usuario={usuario} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/parametros/red" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-red"><ConfiguracionRed usuario={usuario} /></PermissionRoute></ProtectedRoute>} />
              <Route path="/parametros/comandas" element={<ProtectedRoute><PermissionRoute requiredPermission="manage-comandas"><ConfiguracionComandas usuario={usuario} /></PermissionRoute></ProtectedRoute>} />

              {/* === DEFAULT === */}
              <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
            </Routes>
          </div>
        </CajaProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
