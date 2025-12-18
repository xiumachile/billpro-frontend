import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menuApi';
import printerService from '../../services/printerService';
import { 
  ArrowLeft, Printer, Search, Calendar, CheckCircle, XCircle, Clock,
  Utensils, Bike, ShoppingBag, Filter // ✅ Nuevos iconos
} from 'lucide-react';

export default function ReimprimirManager() {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);

  // Filtros
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [busqueda, setBusqueda] = useState('');
  const [tipoPedido, setTipoPedido] = useState(''); // ✅ Nuevo estado: '' = Todos

  // --- CARGA DE DATOS ---
  useEffect(() => {
    cargarPedidos();
  }, [fecha, tipoPedido]); // ✅ Recargar cuando cambie fecha o tipo

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const params = {
        fecha_desde: fecha,
        fecha_hasta: fecha,
        estados: ['pagado', 'entregado', 'pagando', 'cancelado'],
        // ✅ Enviar tipo si está seleccionado
        ...(tipoPedido && { tipo_pedido: tipoPedido }) 
      };
      
      const res = await menuApi.getPedidos(params); 
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      
      // Ordenar: El más reciente primero
      setPedidos(data.sort((a, b) => b.id - a.id));

    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE REIMPRESIÓN ---
  const handleReimprimir = async (pedidoSimple) => {
    setProcesandoId(pedidoSimple.id);
    try {
        const res = await menuApi.getPedidoById(pedidoSimple.id);
        const pedidoFull = res.data || res;

        await printerService.imprimirTicket({ ...pedidoFull, es_reimpresion: true });
        
        alert(`🖨️ Ticket #${pedidoFull.id} enviado a impresora.`);

    } catch (error) {
        console.error(error);
        alert("Error al reimprimir: " + error.message);
    } finally {
        setProcesandoId(null);
    }
  };

  // --- FILTRADO EN CLIENTE (Búsqueda texto) ---
  const pedidosFiltrados = pedidos.filter(p => {
      const term = busqueda.toLowerCase();
      const idStr = String(p.id);
      const mesaStr = p.mesa ? String(p.mesa.numero) : '';
      const clienteStr = p.cliente ? p.cliente.nombre.toLowerCase() : '';
      
      return idStr.includes(term) || mesaStr.includes(term) || clienteStr.includes(term);
  });

  const formatMoney = (val) => `$ ${Math.round(val).toLocaleString('es-CL')}`;
  const formatHora = (fecha) => new Date(fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  // Helper para botones de filtro
  const FilterButton = ({ label, value, icon: Icon }) => (
    <button 
        onClick={() => setTipoPedido(value)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
            tipoPedido === value 
            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
    >
        <Icon size={16} />
        {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate('/')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <ArrowLeft size={20} className="text-gray-600"/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Printer className="text-blue-600"/> Reimprimir
                </h1>
                <p className="text-sm text-gray-500">Historial de tickets</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border w-full md:w-auto">
            <Calendar size={18} className="text-gray-400"/>
            <input 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-gray-700 w-full"
            />
        </div>
      </div>

      {/* ✅ BARRA DE FILTROS DE TIPO */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap gap-2">
          <FilterButton label="Todos" value="" icon={Filter} />
          <FilterButton label="Mesas" value="local" icon={Utensils} />
          <FilterButton label="Delivery" value="delivery" icon={Bike} />
          <FilterButton label="Para Llevar" value="takeout" icon={ShoppingBag} />
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="max-w-5xl mx-auto mb-6">
          <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                type="text" 
                placeholder="Buscar por N° Pedido, Mesa o Cliente..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
          </div>
      </div>

      {/* LISTADO DE PEDIDOS */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b uppercase text-xs">
                  <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Hora</th>
                      <th className="p-4">Tipo / Mesa</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Total</th>
                      <th className="p-4 text-center">Acción</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {loading ? (
                      <tr><td colSpan="7" className="p-8 text-center text-gray-500">Cargando historial...</td></tr>
                  ) : pedidosFiltrados.length === 0 ? (
                      <tr><td colSpan="7" className="p-8 text-center text-gray-400">No se encontraron pedidos con estos filtros.</td></tr>
                  ) : (
                      pedidosFiltrados.map(p => (
                          <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                              <td className="p-4 font-bold text-gray-700">#{p.id}</td>
                              <td className="p-4 text-gray-500 flex items-center gap-1">
                                  <Clock size={14}/> {formatHora(p.created_at)}
                              </td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 w-fit ${
                                      p.tipo_pedido === 'delivery' ? 'bg-green-100 text-green-700' : 
                                      p.tipo_pedido === 'takeout' ? 'bg-purple-100 text-purple-700' : 
                                      'bg-orange-100 text-orange-700'
                                  }`}>
                                      {p.tipo_pedido === 'delivery' && <Bike size={12}/>}
                                      {p.tipo_pedido === 'takeout' && <ShoppingBag size={12}/>}
                                      {p.tipo_pedido === 'local' && <Utensils size={12}/>}
                                      {p.tipo_pedido === 'mesa' && <Utensils size={12}/>}
                                      {p.tipo_pedido}
                                  </span>
                                  {(p.mesa || p.numero_mesa) && (
                                      <span className="block mt-1 font-bold text-gray-700 ml-1">
                                          Mesa {p.mesa?.numero || p.numero_mesa}
                                      </span>
                                  )}
                              </td>
                              <td className="p-4">
                                  <div className="font-medium text-gray-800">{p.cliente?.nombre || 'Anonimo'}</div>
                                  {p.mozo && <div className="text-xs text-gray-400">Atendió: {p.mozo.nombre_completo}</div>}
                              </td>
                              <td className="p-4">
                                  {p.estado === 'cancelado' ? (
                                      <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><XCircle size={14}/> Cancelado</span>
                                  ) : (
                                      <span className="flex items-center gap-1 text-green-600 font-bold text-xs"><CheckCircle size={14}/> {p.estado}</span>
                                  )}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-lg text-gray-800">
                                  {formatMoney(p.total)}
                              </td>
                              <td className="p-4 text-center">
                                  <button 
                                      onClick={() => handleReimprimir(p)}
                                      disabled={procesandoId === p.id}
                                      className="bg-white border-2 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 mx-auto disabled:opacity-50 text-xs"
                                  >
                                      <Printer size={16}/>
                                      {procesandoId === p.id ? '...' : 'Imprimir'}
                                  </button>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
}
