// src/components/FormularioCliente.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Save,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import { menuApi } from '../api/menuApi'; // ✅ Importación de API centralizada
import axios from '../api/axiosInstance'; // ✅ Importación para obtener datos por ID

export default function FormularioCliente({ usuario, esEdicion = false }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    movil: '+569',
    telefono_fijo: '+562',
    direccion: '',
    numero: '',
    comuna: '',
    referencia_direccion: '',
    activo: true,
    motivo_inhabilitacion: '',
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState(esEdicion ? 'Editar Cliente' : 'Nuevo Cliente');

  useEffect(() => {
    if (esEdicion && id) {
      const cargarCliente = async () => {
        setLoading(true);
        try {
          // ✅ Usamos axiosInstance directamente para obtener por ID
          // (Esto aprovecha la IP dinámica configurada)
          const response = await axios.get(`/clientes/${id}`);
          const cliente = response.data;

          setFormData({
            ...cliente,
            movil: cliente.movil || '+569',
            telefono_fijo: cliente.telefono_fijo || '+562',
            numero: cliente.numero || '',
          });
        } catch (err) {
          console.error(err);
          alert('Error al cargar los datos del cliente.');
          navigate('/clientes');
        } finally {
          setLoading(false);
        }
      };
      cargarCliente();
    }
  }, [esEdicion, id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const errs = {};
    if (!formData.nombre.trim()) errs.nombre = 'El nombre es obligatorio.';
    // El apellido puede ser opcional dependiendo de tu lógica, aquí lo dejamos obligatorio como estaba
    if (!formData.apellido?.trim()) errs.apellido = 'El apellido es obligatorio.';
    
    // Validación básica de móvil chileno
    if (!formData.movil.trim() || !/^(\+569)[0-9]{8}$/.test(formData.movil))
      errs.movil = 'Formato inválido. Ej: +56912345678';
      
    if (!formData.activo && !formData.motivo_inhabilitacion?.trim())
      errs.motivo_inhabilitacion = 'Indica el motivo de la inhabilitación.';
      
    setErrores(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.telefono_fijo) delete payload.telefono_fijo;
      if (!payload.direccion) delete payload.direccion;
      payload.numero = payload.numero ? Number(payload.numero) : null; // INTEGER o null
      if (!payload.comuna) delete payload.comuna;
      if (!payload.referencia_direccion) delete payload.referencia_direccion;
      if (payload.activo) delete payload.motivo_inhabilitacion;

      if (esEdicion) {
        // ✅ Usamos menuApi
        await menuApi.actualizarCliente(id, payload);
        alert('Cliente actualizado correctamente.');
      } else {
        // ✅ Usamos menuApi
        await menuApi.crearCliente(payload);
        alert('Cliente creado correctamente.');
      }
      navigate('/clientes');
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('movil')) {
          setErrores((p) => ({ ...p, movil: 'Ya existe un cliente con este móvil.' }));
      } else {
          alert('Error al guardar: ' + (err.message || 'Inténtalo nuevamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && esEdicion)
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
          <div style={{ width: 50, height: 50, border: '5px solid #f3f3f3', borderTop: '5px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ color: '#666' }}>Cargando cliente...</p>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', fontFamily: "'Roboto', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(102,126,234,.4)' }}>
            <User size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{titulo}</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#78909c' }}>Completa los datos del cliente</p>
          </div>
        </div>
        <button onClick={() => navigate('/clientes')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all .2s', boxShadow: '0 2px 8px rgba(108,117,125,.3)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#5a6268'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(108,117,125,.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#6c757d'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(108,117,125,.3)'; }}>
          <ChevronLeft size={18} /> Volver
        </button>
      </div>

      {/* Tarjeta del formulario */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* Nombre */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><User size={16} />Nombre *</label>
              <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre del cliente"
                style={{ width: '100%', padding: '12px 14px', border: errores.nombre ? '1px solid #dc3545' : '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
              {errores.nombre && <div style={{ color: '#dc3545', fontSize: 13, marginTop: 4 }}>{errores.nombre}</div>}
            </div>

            {/* Apellido */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><User size={16} />Apellido *</label>
              <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido del cliente"
                style={{ width: '100%', padding: '12px 14px', border: errores.apellido ? '1px solid #dc3545' : '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
              {errores.apellido && <div style={{ color: '#dc3545', fontSize: 13, marginTop: 4 }}>{errores.apellido}</div>}
            </div>

            {/* Móvil */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><Phone size={16} />Móvil *</label>
              <input name="movil" value={formData.movil} onChange={handleChange} placeholder="+56912345678"
                style={{ width: '100%', padding: '12px 14px', border: errores.movil ? '1px solid #dc3545' : '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
              {errores.movil && <div style={{ color: '#dc3545', fontSize: 13, marginTop: 4 }}>{errores.movil}</div>}
            </div>

            {/* Teléfono fijo */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><Phone size={16} />Teléfono fijo</label>
              <input name="telefono_fijo" value={formData.telefono_fijo} onChange={handleChange} placeholder="+56212345678"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
            </div>

            {/* Dirección */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><MapPin size={16} />Dirección</label>
              <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle / Avenida"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
            </div>

            {/* Número */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><MapPin size={16} />Número</label>
              <input name="numero" value={formData.numero} onChange={handleChange} placeholder="123, Depto 402, etc."
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
            </div>

            {/* Comuna */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><MapPin size={16} />Comuna</label>
              <input name="comuna" value={formData.comuna} onChange={handleChange} placeholder="Comuna"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
            </div>

            {/* Referencia */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#495057' }}><MapPin size={16} />Referencia</label>
              <input name="referencia_direccion" value={formData.referencia_direccion} onChange={handleChange} placeholder="Referencia cercana"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #ced4da', borderRadius: 8, fontSize: 14, transition: 'border .2s' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
            </div>

            {/* Estado (solo edición) */}
            {esEdicion && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#495057' }}>{formData.activo ? <UserCheck color="#28a745" /> : <UserX color="#dc3545" />}Activo</label>
                  <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} style={{ width: 20, height: 20, cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: '#6c757d' }}>Cliente activo</span>
                </div>

                {!formData.activo && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#dc3545' }}><UserX size={16} />Motivo de inhabilitación *</label>
                    <textarea name="motivo_inhabilitacion" value={formData.motivo_inhabilitacion} onChange={handleChange} rows={3} placeholder="Indica el motivo"
                      style={{ width: '100%', padding: '12px 14px', border: errores.motivo_inhabilitacion ? '1px solid #dc3545' : '1px solid #ced4da', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#ced4da' } />
                    {errores.motivo_inhabilitacion && <div style={{ color: '#dc3545', fontSize: 13, marginTop: 4 }}>{errores.motivo_inhabilitacion}</div>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 40 }}>
            <button type="button" onClick={() => navigate('/clientes')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600, transition: 'all .2s', boxShadow: '0 2px 8px rgba(108,117,125,.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#5a6268'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(108,117,125,.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#6c757d'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(108,117,125,.3)'; }}>
              <X size={18} /> Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: loading ? '#6c757d' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, transition: 'all .2s', boxShadow: '0 2px 8px rgba(40,167,69,.3)' }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(40,167,69,.4)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(40,167,69,.3)'; } }}>
              <Save size={18} />{loading ? (esEdicion ? 'Actualizando...' : 'Creando...') : (esEdicion ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>

      {/* Animación spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
