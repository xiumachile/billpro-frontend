import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Search,
  Edit2,
  UserX,
  Users,
  UserCheck,
  Eye,
  X,
  User,
  MapPin,
  Phone,
} from 'lucide-react';
import { menuApi } from '../api/menuApi'; // ✅ Importación correcta (API Centralizada)

export default function Clientes({ usuario }) {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [clienteVer, setClienteVer] = useState(null);

  const abrirModal = (cliente) => {
    setClienteVer(cliente);
    setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false);
    setClienteVer(null);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      // ✅ Usamos menuApi (Axios)
      const res = await menuApi.getClientes();
      console.log('🔍 Respuesta de getClientes():', res);

      // ✅ Extraer array de forma robusta (Axios devuelve data directo gracias al interceptor)
      let clientesData = [];
      if (Array.isArray(res)) {
        clientesData = res;
      } else if (Array.isArray(res?.data)) {
        clientesData = res.data;
      } else if (Array.isArray(res?.clientes)) {
        clientesData = res.clientes;
      } else {
        console.warn('⚠️ Formato de respuesta inesperado. Usando [].');
      }

      // ✅ Normalizar campos numéricos y fechas
      clientesData = clientesData.map(c => ({
        ...c,
        monto_ultima_compra: c.monto_ultima_compra != null 
          ? parseFloat(c.monto_ultima_compra)
          : null,
        fecha_ultima_compra: c.fecha_ultima_compra 
          ? new Date(c.fecha_ultima_compra)
          : null,
      }));

      console.log('✅ Clientes extraídos y normalizados:', clientesData);
      setClientes(clientesData);
    } catch (err) {
      console.error('❌ Error al cargar clientes:', err);
      // No mostramos alerta bloqueante inicial, solo log
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas inhabilitar este cliente?')) return;
    try {
      // ✅ Usamos menuApi (Axios)
      await menuApi.eliminarCliente(id);
      alert('Cliente inhabilitado correctamente.');
      cargarClientes();
    } catch (err) {
      console.error(err);
      alert('Error al inhabilitar el cliente: ' + err.message);
    }
  };

  // ✅ Filtro seguro
  const clientesFiltrados = Array.isArray(clientes)
    ? clientes.filter((c) =>
        (c.nombre?.toLowerCase() + ' ' + c.apellido?.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        (c.movil || '').includes(searchTerm)
      )
    : [];

  const puedeCrear   = usuario?.permissions?.includes('crear-clientes')   ?? true;
  const puedeEditar  = usuario?.permissions?.includes('editar-clientes')  ?? true;
  const puedeEliminar= usuario?.permissions?.includes('eliminar-clientes')?? true;
  const puedeVer     = true;

  const clientesActivos = clientesFiltrados.filter((c) => c.activo).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>Cargando clientes...</p>
        </div>
      </div>
    );
  }

  /* ---------- RENDER ---------- */
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', fontFamily: "'Roboto', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
            <Users size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Gestión de Clientes</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#78909c' }}>Administra tu cartera de clientes</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all .2s', boxShadow: '0 2px 8px rgba(108,117,125,.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5a6268'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(108,117,125,.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6c757d'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(108,117,125,.3)'; }}>
            <ChevronLeft size={18} /> Volver
          </button>
          {puedeCrear && (
            <button onClick={() => navigate('/clientes/nuevo')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all .2s', boxShadow: '0 2px 8px rgba(40,167,69,.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(40,167,69,.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(40,167,69,.3)'; }}>
              <Plus size={18} /> Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* Modal de visualización */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 460, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.3)', position: 'relative' }}>
            {/* Cerrar */}
            <button onClick={cerrarModal} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="#6c757d" />
            </button>

            {/* Título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <User size={28} color="#667eea" />
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#343a40' }}>Datos del cliente</h2>
            </div>

            {/* Campos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={{ fontWeight: 600, color: '#495057' }}>Nombre:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 16, color: '#212529' }}>
                  {clienteVer?.nombre || '-'} {clienteVer?.apellido || ''}
                </p>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#495057' }}>Dirección:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 16, color: '#212529' }}>
                  {clienteVer?.direccion || '-'}
                  {clienteVer?.numero ? ` #${clienteVer.numero}` : ''}
                </p>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#495057' }}>Comuna:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 16, color: '#212529' }}>{clienteVer?.comuna || '-'}</p>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#495057' }}>Móvil:</span>
                <p style={{ margin: '4px 0 0 0', fontSize: 16, color: '#212529' }}>{clienteVer?.movil || '-'}</p>
              </div>
            </div>

            {/* Botones */}
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(
                  `${clienteVer?.direccion || ''} ${clienteVer?.numero || ''}, ${clienteVer?.comuna || ''}, Chile`
                )}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '8px 14px', background: '#4285F4', color: '#fff', borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#3367D6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4285F4')}
              >
                Ver en Google Maps
              </a>
              <button onClick={cerrarModal} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Total clientes */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#78909c', fontWeight: 600 }}>TOTAL CLIENTES</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 'bold', color: '#667eea' }}>{clientesFiltrados.length}</p>
            </div>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="white" />
            </div>
          </div>
        </div>

        {/* Activos */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#78909c', fontWeight: 600 }}>ACTIVOS</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 'bold', color: '#28a745' }}>{clientesActivos}</p>
            </div>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={24} color="white" />
            </div>
          </div>
        </div>

        {/* Inactivos */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#78909c', fontWeight: 600 }}>INACTIVOS</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 'bold', color: '#dc3545' }}>{clientesFiltrados.length - clientesActivos}</p>
            </div>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={24} color="white" />
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#78909c' }} />
          <input type="text" placeholder="Buscar por nombre, apellido o móvil..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 44px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s ease' }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
          />
        </div>
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <th style={{ padding: 16, textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>NOMBRE</th>
                <th style={{ padding: 16, textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>APELLIDO</th>
                <th style={{ padding: 16, textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>MÓVIL</th>
                <th style={{ padding: 16, textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>ESTADO</th>
                <th style={{ padding: 16, textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>ÚLTIMA COMPRA</th>
                <th style={{ padding: 16, textAlign: 'left', color: 'white', fontWeight: 600, fontSize: 13 }}>MONTO</th>
                <th style={{ padding: 16, textAlign: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente, idx) => {
                  return (
                    <tr 
                      key={cliente.id} 
                      style={{ 
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa', 
                        borderBottom: '1px solid #e0e0e0', 
                        transition: 'background-color 0.2s ease' 
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8f9fa')}
                    >
                      <td style={{ padding: 16, fontSize: 14, color: '#333' }}>{cliente.nombre || '-'}</td>
                      <td style={{ padding: 16, fontSize: 14, color: '#333' }}>{cliente.apellido || '-'}</td>
                      <td style={{ padding: 16, fontSize: 14, color: '#333' }}>{cliente.movil || '-'}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          fontSize: 12, 
                          fontWeight: 600, 
                          backgroundColor: cliente.activo ? '#d4edda' : '#f8d7da', 
                          color: cliente.activo ? '#155724' : '#721c24' 
                        }}>
                          {cliente.activo ? 'Activo' : `Inactivo ${cliente.motivo_inhabilitacion ? `(${cliente.motivo_inhabilitacion})` : ''}`}
                        </span>
                      </td>
                      <td style={{ padding: 16, fontSize: 14, color: '#666' }}>
                        {cliente.fecha_ultima_compra 
                          ? cliente.fecha_ultima_compra.toLocaleDateString('es-CL') 
                          : '-'}
                      </td>
                      <td style={{ padding: 16, fontSize: 14, color: '#28a745', fontWeight: 600 }}>
                        {cliente.monto_ultima_compra != null 
                          ? `$${cliente.monto_ultima_compra.toLocaleString('es-CL', { 
                              minimumFractionDigits: 0, 
                              maximumFractionDigits: 2 
                            })}`
                          : '-'}
                      </td>
                      <td style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          {/* VER */}
                          {puedeVer && (
                            <button 
                              onClick={() => abrirModal(cliente)} 
                              title="Ver cliente"
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4, 
                                padding: '6px 10px', 
                                backgroundColor: '#17a2b8', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 6, 
                                cursor: 'pointer', 
                                fontSize: 13, 
                                fontWeight: 600, 
                                transition: 'all .2s' 
                              }}
                              onMouseEnter={(e) => { 
                                e.currentTarget.style.backgroundColor = '#138496'; 
                                e.currentTarget.style.transform = 'translateY(-2px)'; 
                              }}
                              onMouseLeave={(e) => { 
                                e.currentTarget.style.backgroundColor = '#17a2b8'; 
                                e.currentTarget.style.transform = 'translateY(0)'; 
                              }}
                            >
                              <Eye size={14} /> Ver
                            </button>
                          )}

                          {puedeEditar && (
                            <button 
                              onClick={() => navigate(`/clientes/editar/${cliente.id}`)} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4, 
                                padding: '6px 12px', 
                                backgroundColor: '#007bff', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 6, 
                                cursor: 'pointer', 
                                fontSize: 13, 
                                fontWeight: 600, 
                                transition: 'all .2s' 
                              }}
                              onMouseEnter={(e) => { 
                                e.currentTarget.style.backgroundColor = '#0056b3'; 
                                e.currentTarget.style.transform = 'translateY(-2px)'; 
                              }}
                              onMouseLeave={(e) => { 
                                e.currentTarget.style.backgroundColor = '#007bff'; 
                                e.currentTarget.style.transform = 'translateY(0)'; 
                              }}
                            >
                              <Edit2 size={14} /> Editar
                            </button>
                          )}

                          {puedeEliminar && cliente.activo && (
                            <button 
                              onClick={() => handleDelete(cliente.id)} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4, 
                                padding: '6px 12px', 
                                backgroundColor: '#dc3545', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 6, 
                                cursor: 'pointer', 
                                fontSize: 13, 
                                fontWeight: 600, 
                                transition: 'all .2s' 
                              }}
                              onMouseEnter={(e) => { 
                                e.currentTarget.style.backgroundColor = '#c82333'; 
                                e.currentTarget.style.transform = 'translateY(-2px)'; 
                              }}
                              onMouseLeave={(e) => { 
                                e.currentTarget.style.backgroundColor = '#dc3545'; 
                                e.currentTarget.style.transform = 'translateY(0)'; 
                              }}
                            >
                              <UserX size={14} /> Inhabilitar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', fontSize: 16, color: '#999' }}>
                    <Users size={48} color="#ccc" style={{ marginBottom: 16 }} />
                    <br />No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Animación de carga */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
