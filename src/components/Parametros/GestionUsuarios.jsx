import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menuApi';
import { 
  Users, UserPlus, Edit3, Trash2, Shield, CheckCircle, XCircle, Search, RefreshCw, ArrowLeft, X, Key 
} from 'lucide-react';

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [filtro, setFiltro] = useState('');

  // ✅ ESTRUCTURA CORRECTA SEGÚN TU DB
  const [formData, setFormData] = useState({
    id: null,
    nombre_completo: '', // Nombre del personal
    username: '',        // AQUÍ VA EL PIN (ej: 1234)
    password: '',        // Contraseña del sistema
    role: '',            // Rol (Admin, Mozo, etc)
    activo: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        menuApi.getUsuarios(),
        menuApi.getRoles()
      ]);

      const listaUsuarios = Array.isArray(usersData) ? usersData : (usersData?.data || []);
      setUsuarios(listaUsuarios);
      
      let listaRoles = [];
      const rawRoles = rolesData?.data || rolesData;
      
      if (Array.isArray(rawRoles) && rawRoles.length > 0) {
          listaRoles = rawRoles.map(r => ({
              name: typeof r === 'string' ? r : (r.name || r.nombre || 'Sin Nombre')
          }));
      } else {
          // Fallback por si la API falla
          listaRoles = [{ name: 'admin' }, { name: 'cajero' }, { name: 'mozo' }, { name: 'cocina' }];
      }
      setRoles(listaRoles);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
        id: null, 
        nombre_completo: '', 
        username: '', // Reset PIN
        password: '', 
        role: '', 
        activo: true 
    });
    setModoEdicion(false);
  };

  const handleNuevo = () => {
    resetForm();
    setModalAbierto(true);
  };

  const handleEditar = (user) => {
    let userRole = '';
    if (user.roles && user.roles.length > 0) {
        userRole = user.roles[0].name || user.roles[0];
    } else if (user.role) {
        userRole = user.role;
    }

    setFormData({
      id: user.id,
      nombre_completo: user.nombre_completo || user.name || '',
      username: user.username, // ✅ Aquí cargamos el PIN existente
      password: '',
      role: userRole,
      activo: user.activo !== undefined ? user.activo : true
    });
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar usuario?')) return;
    try {
      await menuApi.eliminarUsuario(id);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      alert('✅ Usuario eliminado');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    // Validamos que username (PIN) tenga datos
    if (!formData.nombre_completo || !formData.username || !formData.role) {
        return alert('Faltan datos obligatorios (Nombre, PIN, Rol).');
    }
    
    if (!modoEdicion && !formData.password) {
        return alert('La contraseña es obligatoria para nuevos usuarios.');
    }

    setProcesando(true);
    try {
      // Preparamos payload mapeando a lo que espera Laravel
      const payload = { 
          nombre_completo: formData.nombre_completo,
          name: formData.nombre_completo, // Compatibilidad
          
          username: formData.username,    // ✅ Enviamos el PIN como username
          email: formData.username + '@local.com', // Fake email si Laravel lo exige obligatoriamente
          
          role: formData.role,
          activo: formData.activo
      };

      if (formData.password) {
          payload.password = formData.password;
      }

      if (modoEdicion) {
        await menuApi.actualizarUsuario(formData.id, payload);
        alert('✅ Actualizado');
      } else {
        await menuApi.crearUsuario(payload);
        alert('✅ Creado');
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  // Filtrado
  const usuariosFiltrados = usuarios.filter(u => {
    const nombre = (u.nombre_completo || u.name || '').toLowerCase();
    const pin = (u.username || '').toLowerCase();
    const busqueda = filtro.toLowerCase();
    return nombre.includes(busqueda) || pin.includes(busqueda);
  });

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => navigate('/')} className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 shadow-sm">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-blue-600" /> Gestión de Usuarios
            </h1>
            <p className="text-gray-500 text-sm">Administre el personal y roles.</p>
          </div>
        </div>
        <button onClick={handleNuevo} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Buscar por nombre o PIN..." value={filtro} onChange={e => setFiltro(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={cargarDatos} className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600"><RefreshCw size={18}/></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Nombre Personal</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-center">PIN (Acceso)</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan="5" className="p-8 text-center">Cargando...</td></tr> : 
               usuariosFiltrados.length === 0 ? <tr><td colSpan="5" className="p-8 text-center">Sin resultados.</td></tr> :
               usuariosFiltrados.map(user => (
                  <tr key={user.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{user.nombre_completo || user.name}</p>
                    </td>
                    <td className="px-6 py-4">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold uppercase">
                            {(user.roles && user.roles[0]?.name) || user.role || 'N/A'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {/* ✅ Aquí mostramos el username como PIN */}
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded border border-gray-300 font-mono font-bold tracking-wider">
                            {user.username}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {user.activo ? 
                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-200">Activo</span> : 
                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200">Inactivo</span>
                        }
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditar(user)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit3 size={18}/></button>
                            <button onClick={() => handleEliminar(user.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18}/></button>
                        </div>
                    </td>
                  </tr>
               ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-800 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">{modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setModalAbierto(false)} className="hover:text-gray-300"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              
              {/* CAMPO NOMBRE */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input 
                    type="text" required 
                    className="w-full border p-2.5 rounded-lg focus:border-blue-500 outline-none" 
                    value={formData.nombre_completo} 
                    onChange={e => setFormData({...formData, nombre_completo: e.target.value})} 
                    placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* CAMPO PIN (USERNAME) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Key size={14}/> PIN (Acceso)
                  </label>
                  <input 
                    type="text" required 
                    pattern="\d*" maxLength="6"
                    className="w-full border p-2.5 rounded-lg focus:border-blue-500 outline-none font-mono text-center font-bold tracking-widest" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value.replace(/\D/g,'')})} // Solo números
                    placeholder="1234"
                  />
                </div>

                {/* CAMPO ROL */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Rol</label>
                  <select required className="w-full border p-2.5 rounded-lg bg-white focus:border-blue-500 outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="">-- Seleccionar --</option>
                    {roles.length > 0 ? (
                        roles.map((r, idx) => (<option key={idx} value={r.name}>{r.name}</option>))
                    ) : (
                        <option disabled>Cargando roles...</option>
                    )}
                  </select>
                </div>
              </div>

              {/* CAMPO CONTRASEÑA (Para admin o seguridad extra) */}
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {modoEdicion ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                  </label>
                  <input 
                    type="password" 
                    className="w-full border p-2.5 rounded-lg focus:border-blue-500 outline-none" 
                    placeholder="******" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                  <p className="text-xs text-gray-400 mt-1">Usada para accesos administrativos remotos.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="activo" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700 select-none">
                  Usuario Activo (Permitir ingreso)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={procesando} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50">
                  {procesando ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
