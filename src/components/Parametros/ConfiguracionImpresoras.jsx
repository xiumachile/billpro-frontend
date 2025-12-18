import React, { useState, useEffect } from 'react';
import { parametrosApi } from '../../api/parametrosApi';
import printerService from '../../services/printerService'; 
import { 
  Printer, Plus, Trash2, Edit3, CheckCircle, XCircle, RefreshCw, Server, Usb, Save, X, Monitor 
} from 'lucide-react';

export default function ConfiguracionImpresoras() {
  const [impresorasBD, setImpresorasBD] = useState([]);
  const [impresorasSistema, setImpresorasSistema] = useState([]); // Lista real del OS (Rust)
  
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [probando, setProbando] = useState(null);
  
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    tipo_impresora: 'Cocina', // Zona
    tipo_conexion: 'usb',     // 'usb' o 'red'
    puerto_uri: '',           // Nombre en el sistema (USB)
    ip: '',                   // IP (Red)
    puerto: '9100',           // Puerto (Red)
    estado: 'Activa'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar desde API
      const respuesta = await parametrosApi.getImpresoras();
      setImpresorasBD(Array.isArray(respuesta) ? respuesta : (respuesta.data || []));

      // 2. Cargar físicas desde Rust (Solo si es Desktop)
      if (window.__TAURI__) {
          const fisicas = await printerService.obtenerImpresorasSistema();
          setImpresorasSistema(fisicas || []);
      }
    } catch (error) {
      console.error('Error cargando impresoras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (impresora = null) => {
    if (impresora) {
      setFormData({
        id: impresora.id,
        nombre: impresora.nombre,
        tipo_impresora: impresora.tipo_impresora || 'Cocina',
        tipo_conexion: impresora.tipo_conexion || 'usb',
        puerto_uri: impresora.puerto_uri || '',
        ip: impresora.ip || '',
        puerto: impresora.puerto || '9100',
        estado: impresora.estado || 'Activa'
      });
    } else {
      setFormData({
        id: null,
        nombre: '',
        tipo_impresora: 'Cocina',
        tipo_conexion: 'usb',
        puerto_uri: '',
        ip: '',
        puerto: '9100',
        estado: 'Activa'
      });
    }
    setModalOpen(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.tipo_conexion === 'usb' && !formData.puerto_uri) return alert("Seleccione una impresora física.");
    if (formData.tipo_conexion === 'red' && !formData.ip) return alert("Ingrese la dirección IP.");

    try {
      if (formData.id) {
        await parametrosApi.updateImpresora(formData.id, formData);
        alert('✅ Configuración actualizada');
      } else {
        await parametrosApi.createImpresora(formData);
        alert('✅ Impresora registrada');
      }
      setModalOpen(false);
      cargarDatos();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta impresora?')) return;
    try {
      await parametrosApi.deleteImpresora(id);
      setImpresorasBD(prev => prev.filter(imp => imp.id !== id));
    } catch (error) { alert('Error: ' + error.message); }
  };

  // ✅ PRUEBA DE CONEXIÓN REAL
  const handleProbarConexion = async (config) => {
    setProbando(config.id);
    try {
      // Creamos un pedido falso para probar
      const pedidoTest = {
          id: 9999,
          total: 12345,
          items: [{ cantidad: 1, precio_unitario: 12345, producto: { nombre: 'PRUEBA DE CONEXIÓN' } }],
          mesa: { numero: 'TEST' },
          mozo: { nombre_completo: 'Admin' }
      };

      // Si es USB, enviamos el nombre. Si es Red, el printerService usará la IP.
      // Pero como printerService normalmente busca en la BD por Zona,
      // aquí llamamos a un método interno o simulamos la lógica.
      // Para simplificar, en el servicio agregué lógica para recibir "impresoraForzada"
      // o construimos un objeto temporal.
      
      /* TRUCO: Como printerService.imprimirTicket busca por ZONA, y aquí queremos probar
         una configuración específica que quizás aun no es la oficial de la zona,
         podemos invocar directamente a Rust si estamos en Tauri. */

      if (window.__TAURI__) {
          const invoke = window.__TAURI__.invoke;
          // Generamos bytes (necesita acceso a printerService interno, 
          // mejor usamos la función pública que expusimos en el paso anterior)
          
          // Llamamos a imprimirTicket pasándole un nombre especial que el servicio interceptará
          // OJO: En el código de printerService anterior agregué soporte para `impresoraForzadaNombre`
          // Si es RED, pasamos la IP. Si es USB, el nombre.
          
          const identificador = config.tipo_conexion === 'red' ? config.ip : config.puerto_uri;
          
          await printerService.imprimirTicket(pedidoTest, identificador); 
          
          alert(`🖨️ Prueba enviada a: ${identificador}`);
      } else {
          alert("🌐 En modo Web solo se genera PDF.");
          printerService.imprimirTicket(pedidoTest);
      }

    } catch (error) {
      console.error(error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProbando(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Printer className="text-blue-600" /> Configuración de Impresoras
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de dispositivos de impresión (USB / Red)</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
          <Plus size={20} /> Nueva Impresora
        </button>
      </div>

      {/* Alerta Web */}
      {!window.__TAURI__ && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 text-orange-700 text-sm flex gap-2">
              <Monitor/> Estás en modo Web. La detección automática USB no está disponible. Ingresa los nombres manualmente.
          </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400 flex flex-col items-center"><RefreshCw className="animate-spin mb-2"/> Cargando...</div> : 
         impresorasBD.length === 0 ? <div className="p-12 text-center text-gray-400">No hay impresoras.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">Zona / Uso</th>
                  <th className="px-6 py-4">Conexión</th>
                  <th className="px-6 py-4">Detalle</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {impresorasBD.map((imp) => (
                    <tr key={imp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{imp.nombre} <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{imp.tipo_impresora}</span></td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold w-fit ${imp.tipo_conexion === 'red' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {imp.tipo_conexion === 'red' ? <Server size={12}/> : <Usb size={12}/>}
                            {imp.tipo_conexion === 'red' ? 'RED (TCP)' : 'USB / LOCAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                          {imp.tipo_conexion === 'red' ? `${imp.ip}:${imp.puerto}` : imp.puerto_uri}
                      </td>
                      <td className="px-6 py-4">
                        {imp.estado === 'Activa' ? <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={14}/> OK</span> : <span className="text-red-500 font-bold text-xs flex items-center gap-1"><XCircle size={14}/> OFF</span>}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button onClick={() => handleProbarConexion(imp)} className="p-2 text-green-600 hover:bg-green-50 rounded"><Printer size={18}/></button>
                          <button onClick={() => handleOpenModal(imp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit3 size={18}/></button>
                          <button onClick={() => handleEliminar(imp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-gray-800 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg flex items-center gap-2">{formData.id ? <Edit3/> : <Plus/>} {formData.id ? 'Editar' : 'Nueva'} Impresora</h2>
              <button onClick={() => setModalOpen(false)}><X/></button>
            </div>
            
            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre Identificador</label>
                    <input type="text" required className="w-full border-2 rounded-lg p-2 outline-none focus:border-blue-500" placeholder="Ej: Caja Principal" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Zona Asignada</label>
                    <select className="w-full border-2 rounded-lg p-2 bg-white" value={formData.tipo_impresora} onChange={e => setFormData({...formData, tipo_impresora: e.target.value})}>
                        <option value="Caja">Caja / Ticket</option>
                        <option value="Cocina">Cocina</option>
                        <option value="Bar">Bar</option>
                        <option value="Cuenta">Pre-Cuenta</option>
                        <option value="Personalizada">Otro</option>
                    </select>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tipo de Conexión</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                      <button type="button" onClick={() => setFormData({...formData, tipo_conexion: 'usb'})} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${formData.tipo_conexion==='usb' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>USB / Local</button>
                      <button type="button" onClick={() => setFormData({...formData, tipo_conexion: 'red'})} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${formData.tipo_conexion==='red' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Red (TCP/IP)</button>
                  </div>
              </div>

              {formData.tipo_conexion === 'red' ? (
                <div className="grid grid-cols-3 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-purple-800 mb-1">Dirección IP</label>
                        <input type="text" className="w-full border p-2 rounded font-mono" placeholder="192.168.1.200" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-purple-800 mb-1">Puerto</label>
                        <input type="text" className="w-full border p-2 rounded font-mono" value={formData.puerto} onChange={e => setFormData({...formData, puerto: e.target.value})} />
                    </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-2"><Usb size={14}/> Dispositivo del Sistema</label>
                    {window.__TAURI__ ? (
                        <select className="w-full border p-2 rounded bg-white" value={formData.puerto_uri} onChange={e => setFormData({...formData, puerto_uri: e.target.value})}>
                            <option value="">-- Seleccionar --</option>
                            {impresorasSistema.map((n, i) => <option key={i} value={n}>{n}</option>)}
                        </select>
                    ) : (
                        <input className="w-full border p-2 rounded" placeholder="Ej: EPSON TM-T20" value={formData.puerto_uri} onChange={e => setFormData({...formData, puerto_uri: e.target.value})} />
                    )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2"><Save size={18}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
