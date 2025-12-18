import React, { useState, useEffect, useCallback } from 'react';
import BotonGrid from './BotonGrid';
import BotonModal from './BotonModal';
import ListarProductosModal from './ListarProductosModal';
import ListarCombosModal from './ListarCombosModal';
import DetalleProductoModal from './DetalleProductoModal';
import DetalleComboModal from './DetalleComboModal';
import CrearCartaModal from './CrearCartaModal';
import CrearSubpantallaModal from './CrearSubpantallaModal';
// ✅ Nuevos modales de edición
import EditarProductoModal from './EditarProductoModal';
import EditarComboModal from './EditarComboModal';
import EditarSubpantallaModal from './EditarSubpantallaModal'; // Asumiendo que lo creaste

import { menuApi } from '../../api/menuApi';
import { 
  ArrowLeft, 
  Layout, 
  Layers, 
  Package, 
  Grid3x3, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3, // Icono para editar
  Trash2  // Icono para eliminar
} from 'lucide-react';

const BOTONES_VACIOS = Array.from({ length: 35 }, (_, i) => ({ 
  posicion: i + 1, 
  activo: false,
  bg_color: '#f3f4f6',
  text_color: '#374151',
  font_size: 'text-sm',
  tipo: null,
  referencia_id: null,
  etiqueta: null
}));

export default function MenuManager({ 
  usuario, 
  onVolver
}) {
  // Estados principales
  const [cartas, setCartas] = useState([]);
  const [pantallas, setPantallas] = useState([]);
  const [botones, setBotones] = useState([...BOTONES_VACIOS]);
  
  // Selección
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [pantallaSeleccionada, setPantallaSeleccionada] = useState(null);
  
  // Datos auxiliares
  const [productosGlobales, setProductosGlobales] = useState([]);
  const [combos, setCombos] = useState([]);
  const [subpantallas, setSubpantallas] = useState([]);
  const [productosInventario, setProductosInventario] = useState([]);
  const [productosCarta, setProductosCarta] = useState([]);

  // Estados para modales
  const [modalOpen, setModalOpen] = useState(false);
  const [posicionEdit, setPosicionEdit] = useState(null);
  const [showListaProductosCarta, setShowListaProductosCarta] = useState(false);
  const [showListaCombos, setShowListaCombos] = useState(false);
  const [showCrearCartaModal, setShowCrearCartaModal] = useState(false);
  const [showCrearSubpantallaModal, setShowCrearSubpantallaModal] = useState(false);
  
  // ✅ Nuevos estados para edición/eliminación
  const [showEditarProductoModal, setShowEditarProductoModal] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [showEditarComboModal, setShowEditarComboModal] = useState(false);
  const [comboAEditar, setComboAEditar] = useState(null);
  const [showEditarSubpantallaModal, setShowEditarSubpantallaModal] = useState(false);
  const [subpantallaAEditar, setSubpantallaAEditar] = useState(null);
  const [showEditarCartaModal, setShowEditarCartaModal] = useState(false);
  const [cartaAEditar, setCartaAEditar] = useState(null);

  // Estados para confirmar eliminación
  const [showEliminarCartaModal, setShowEliminarCartaModal] = useState(false);
  const [cartaAEliminar, setCartaAEliminar] = useState(null);
  const [showEliminarSubpantallaModal, setShowEliminarSubpantallaModal] = useState(false);
  const [subpantallaAEliminar, setSubpantallaAEliminar] = useState(null);

  // Nuevos estados para modales de detalle
  const [showDetalleProducto, setShowDetalleProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [showDetalleCombo, setShowDetalleCombo] = useState(false);
  const [comboSeleccionado, setComboSeleccionado] = useState(null);

  // Estado para loading
  const [loading, setLoading] = useState(false);

  // Carga inicial
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoading(true);
      try {
        const [cartasRes, productosRes, combosRes, inventarioRes] = await Promise.allSettled([
          menuApi.getCartas(),
          menuApi.getProductosCarta(),
          menuApi.getCombos(),
          menuApi.getProductosInventario()
        ]);

        const cartasCargadas = cartasRes.status === 'fulfilled' && Array.isArray(cartasRes.value) ? cartasRes.value : [];
        setCartas(cartasCargadas);
        
        // ✅ Validar que exista al menos una carta activa
        const cartaActiva = cartasCargadas.find(c => c.estado === 'activa');
        if (cartasCargadas.length > 0 && !cartaActiva) {
          console.warn('⚠️ No hay ninguna carta activa. Se debe activar una carta.');
          alert('⚠️ Atención: No hay ninguna carta activa.\nPor favor, activa una carta para comenzar a trabajar.');
        } else if (cartasCargadas.length === 0) {
          console.warn('⚠️ No hay cartas en el sistema. Crea una carta para comenzar.');
          alert('ℹ️ No hay cartas en el sistema.\nCrea una nueva carta para comenzar.');
        }
        
        setProductosGlobales(productosRes.status === 'fulfilled' && Array.isArray(productosRes.value) ? productosRes.value : []);
        setCombos(combosRes.status === 'fulfilled' && Array.isArray(combosRes.value) ? combosRes.value : []);
        setProductosInventario(inventarioRes.status === 'fulfilled' && Array.isArray(inventarioRes.value?.data) ? inventarioRes.value.data : []);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        alert('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    cargarDatosIniciales();
  }, []);

  // Carga de botones cuando cambia la pantalla
  useEffect(() => {
    if (!pantallaSeleccionada) {
      setBotones([...BOTONES_VACIOS]);
      return;
    }

    const cargarBotones = async () => {
      try {
        const res = await menuApi.getBotonesByPantalla(pantallaSeleccionada);
        const data = Array.isArray(res) ? res : [];
        const botonesMap = new Map(data.map(b => [b.posicion, b]));
        
        const botonesCompleto = Array.from({ length: 35 }, (_, i) => {
          const pos = i + 1;
          return botonesMap.has(pos) ? botonesMap.get(pos) : { 
            posicion: pos, 
            activo: false,
            bg_color: '#f3f4f6',
            text_color: '#374151',
            font_size: 'text-sm',
            tipo: null,
            referencia_id: null,
            etiqueta: null
          };
        });
        
        setBotones(botonesCompleto);
      } catch (error) {
        console.error('Error al cargar botones:', error);
        setBotones([...BOTONES_VACIOS]);
      }
    };

    cargarBotones();
  }, [pantallaSeleccionada]);

  // ✅ NUEVO: Función para guardar un solo botón
  const handleUpdateSingleBoton = useCallback(async (posicion, datos) => {
    if (!pantallaSeleccionada) {
      console.warn('⚠️ No hay pantalla seleccionada para guardar el botón');
      return;
    }

    // Mapeo para asegurar formato correcto
    const fontSizeMap = {
      'extra-small': 'text-xs',
      'small': 'text-sm',
      'medium': 'text-base',
      'large': 'text-lg',
      'extra-large': 'text-xl',
      'xxl': 'text-2xl',
      'xxxl': 'text-3xl'
    };

    const datosNormalizados = {
      ...datos,
      font_size: fontSizeMap[datos.font_size] || datos.font_size || 'text-sm',
    };

    try {
      const botonActualizado = await menuApi.updateBoton(pantallaSeleccionada, posicion, datosNormalizados);
      
      // Actualizar estado local para feedback inmediato
      setBotones(prev => 
        prev.map(b => 
          b.posicion === posicion 
            ? { ...b, ...botonActualizado } 
            : b
        )
      );
      
      console.log(`✅ Botón ${posicion} guardado:`, botonActualizado);
    } catch (error) {
      console.error(`❌ Error al guardar botón ${posicion}:`, error);
      alert(`❌ Error al guardar botón ${posicion}: ${error.message || 'Verifica la consola'}`);
      throw error;
    }
  }, [pantallaSeleccionada]);

  // Función para actualizar un botón individualmente (solo preview)
  const handleUpdateBoton = useCallback((posicion, campo, valor) => {
    setBotones(prevBotones =>
      prevBotones.map(boton =>
        boton.posicion === posicion
          ? { ...boton, [campo]: valor }
          : boton
      )
    );
  }, []);

  // ✅ CORREGIDO: Guardar botón desde modal ahora persiste en la BD
const handleGuardarBoton = useCallback(async (datosBoton) => {
  try {
    // ✅ Delegar en handleUpdateSingleBoton para garantizar persistencia
    await handleUpdateSingleBoton(datosBoton.posicion, datosBoton);
    setModalOpen(false);
  } catch (error) {
    console.error('Error al guardar botón desde modal:', error);
    // La alerta ya está en handleUpdateSingleBoton
  }
}, [handleUpdateSingleBoton]);

  // Función para cargar productos desde botones
  const cargarProductosDesdeBotones = async (pantallasData) => {
    try {
      const idsPantallas = pantallasData.map(p => p.id);
      const todosBotones = [];
      
      for (const id of idsPantallas) {
        const botonesRes = await menuApi.getBotonesByPantalla(id);
        if (Array.isArray(botonesRes)) {
          todosBotones.push(...botonesRes);
        }
      }
      
      const productoIds = [...new Set(
        todosBotones
          .filter(b => b.activo && b.tipo === 'platillo' && b.referencia_id)
          .map(b => b.referencia_id)
      )];
      
      const productosDeCarta = productosGlobales.filter(p => productoIds.includes(p.id));
      setProductosCarta(productosDeCarta);
    } catch (error) {
      console.error('Error al cargar productos desde botones:', error);
      setProductosCarta([]);
    }
  };

  // Cargar datos de la carta seleccionada
  useEffect(() => {
    if (!cartaSeleccionada) {
      setProductosCarta([]);
      setSubpantallas([]);
      setPantallas([]);
      setPantallaSeleccionada(null);
      setBotones([...BOTONES_VACIOS]);
      return;
    }

    const cargarDatosCarta = async () => {
      setLoading(true);
      try {
        const pantallasRes = await menuApi.getPantallasByCarta(cartaSeleccionada);
        const pantallasData = Array.isArray(pantallasRes) ? pantallasRes : [];
        setPantallas(pantallasData);
        setSubpantallas(pantallasData.filter(p => !p.es_principal));
        await cargarProductosDesdeBotones(pantallasData);

        if (pantallasData.length > 0) {
          setPantallaSeleccionada(pantallasData[0].id);
        } else {
          setPantallaSeleccionada(null);
          setBotones([...BOTONES_VACIOS]);
        }
      } catch (error) {
        console.error('Error al cargar datos de la carta:', error);
        alert('❌ Error al cargar los datos de la carta');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatosCarta();
  }, [cartaSeleccionada, productosGlobales]);

  // Función para editar un botón
  const handleEditarBoton = useCallback((posicion) => {
    setPosicionEdit(posicion);
    setModalOpen(true);
  }, []);

  // Función para crear platillo desde el botón
  const handleCrearPlatilloDesdeBoton = async (nuevoProducto) => {
    try {
      const productoCreado = await menuApi.crearProductoCarta(nuevoProducto);
      setProductosGlobales(prev => [...prev, productoCreado]);
      setProductosCarta(prev => [...prev, productoCreado]);
      return productoCreado;
    } catch (error) {
      console.error('Error al crear platillo desde botón:', error);
      throw error;
    }
  };

  // Función para crear combo desde el botón
  const handleCrearComboDesdeBoton = async (nuevoCombo) => {
    try {
      const comboCreado = await menuApi.crearCombo(nuevoCombo);
      setCombos(prev => [...prev, comboCreado]);
      return comboCreado;
    } catch (error) {
      console.error('Error al crear combo desde botón:', error);
      throw error;
    }
  };

  const getSubpantallasDisponibles = useCallback(() => {
    if (!cartaSeleccionada || !pantallaSeleccionada || !Array.isArray(botones)) return [];
    
    const subpantallasUsadas = new Set(
      botones
        .filter(boton => boton.activo && boton.tipo === 'link' && boton.referencia_id)
        .map(boton => boton.referencia_id)
    );
    
    return subpantallas.filter(pantalla => 
      !subpantallasUsadas.has(pantalla.id) &&
      pantalla.id !== pantallaSeleccionada
    );
  }, [cartaSeleccionada, pantallaSeleccionada, botones, subpantallas]);

  // Función para obtener el nombre del usuario
  const obtenerNombreUsuario = () => {
    if (!usuario) return 'Usuario';
    if (typeof usuario === 'string') return usuario;
    return usuario.nombre_completo || usuario.username || 'Usuario';
  };

  const obtenerInicialUsuario = () => {
    const nombre = obtenerNombreUsuario();
    return nombre.charAt(0).toUpperCase();
  };

  // Manejar el volver con validación
  const handleVolver = () => {
    if (typeof onVolver === 'function') {
      onVolver();
    } else {
      console.error('onVolver no es una función');
      window.history.back();
    }
  };

  // Función para crear una nueva carta
  const handleCrearCarta = async (datosNuevaCarta) => {
    try {
      console.log('📤 Datos enviados para crear carta:', datosNuevaCarta);
      
      const cartaCreada = await menuApi.crearCarta(datosNuevaCarta);
      
      console.log('✅ Carta creada exitosamente:', cartaCreada);
      
      setCartas(prev => [...prev, cartaCreada]);
      setCartaSeleccionada(cartaCreada.id);
      
      alert('✅ Carta creada exitosamente en estado inactivo');
    } catch (error) {
      console.error('❌ Error completo al crear carta:', error);
      console.error('Mensajes de error:', error.messages);
      
      if (error.messages) {
        const mensajesDetallados = Object.entries(error.messages)
          .map(([campo, errores]) => `${campo}: ${errores.join(', ')}`)
          .join('\n');
        throw new Error(`Errores de validación:\n${mensajesDetallados}`);
      }
      throw error;
    }
  };

  // ✅ NUEVA: Función para activar una carta
  const handleActivarCarta = async () => {
    if (!cartaSeleccionada) {
      alert('⚠️ Debes seleccionar una carta primero');
      return;
    }

    const cartaActual = cartas.find(c => c.id === cartaSeleccionada);
    
    if (cartaActual?.estado === 'activa') {
      alert('ℹ️ Esta carta ya está activa');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas activar esta carta?\n\nSi hay otra carta activa, se desactivará automáticamente.')) {
      return;
    }

    setLoading(true);
    try {
      await menuApi.activarCarta(cartaSeleccionada);
      const cartasActualizadas = await menuApi.getCartas();
      setCartas(Array.isArray(cartasActualizadas) ? cartasActualizadas : []);
      alert('✅ Carta activada exitosamente');
    } catch (error) {
      console.error('Error al activar carta:', error);
      alert('❌ Error al activar la carta: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVA: Función para desactivar una carta
  const handleDesactivarCarta = async () => {
    if (!cartaSeleccionada) {
      alert('⚠️ Debes seleccionar una carta primero');
      return;
    }

    const cartaActual = cartas.find(c => c.id === cartaSeleccionada);
    
    if (cartaActual?.estado === 'inactiva') {
      alert('ℹ️ Esta carta ya está inactiva');
      return;
    }

    const cartasActivas = cartas.filter(c => c.estado === 'activa');
    if (cartasActivas.length === 1 && cartaActual?.estado === 'activa') {
      alert('⚠️ No puedes desactivar la única carta activa.\nDebes activar otra carta primero.');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas desactivar esta carta?')) {
      return;
    }

    setLoading(true);
    try {
      await menuApi.desactivarCarta(cartaSeleccionada);
      const cartasActualizadas = await menuApi.getCartas();
      setCartas(Array.isArray(cartasActualizadas) ? cartasActualizadas : []);
      alert('✅ Carta desactivada exitosamente');
    } catch (error) {
      console.error('Error al desactivar carta:', error);
      alert('❌ Error al desactivar la carta: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Función para crear una nueva subpantalla
  const handleCrearSubpantalla = async (datosNuevaSubpantalla) => {
    try {
      const subpantallaCreada = await menuApi.crearPantalla(datosNuevaSubpantalla);
      setPantallas(prev => [...prev, subpantallaCreada]);
      setSubpantallas(prev => [...prev, subpantallaCreada]);
      setPantallaSeleccionada(subpantallaCreada.id);
      alert('✅ Subpantalla creada exitosamente');
    } catch (error) {
      console.error('Error al crear subpantalla:', error);
      throw new Error(error.message || 'Error al crear la subpantalla');
    }
  };

  // ✅ EDICIÓN: Editar producto
  const handleEditarProducto = (producto) => {
    console.log('🔍 Producto para edición:', producto);    
    setProductoAEditar(producto);
    setShowEditarProductoModal(true);
  };

  // ✅ EDICIÓN: Editar combo
  const handleEditarCombo = (combo) => {
    setComboAEditar(combo);
    setShowEditarComboModal(true);
  };

  // ✅ EDICIÓN: Editar subpantalla
  const handleEditarSubpantalla = (subpantalla) => {
    setSubpantallaAEditar(subpantalla);
    setShowEditarSubpantallaModal(true);
  };

  // ✅ EDICIÓN: Editar carta (usando prompt como ejemplo, puedes mejorar con modal)
const handleEditarCarta = (carta) => {
  const nuevoNombre = prompt('Nuevo nombre para la carta:', carta.nombre);
  if (nuevoNombre !== null && nuevoNombre.trim() !== '' && nuevoNombre.trim() !== carta.nombre) {
    // ✅ Pasa un objeto con los campos a actualizar
    handleActualizarNombreCarta(carta.id, { 
      nombre: nuevoNombre.trim(),
      descripcion: carta.descripcion // Mantener otros campos
    });
  }
};

  // ✅ EDICIÓN: Actualizar nombre de carta (API)
// ✅ Asegúrate de que esta función use menuApi
const handleActualizarNombreCarta = async (id, datos) => {
  try {
    // Suponiendo que menuApi tiene un método actualizarCarta
    // Si no existe, debes agregarlo en menuApi.js:
    // actualizarCarta: (id, datos) => fetch(`${API_BASE}/cartas/${id}`, { method: 'PUT', ... })
    const cartaActualizada = await menuApi.actualizarCarta(id, datos);

    // Actualizar el estado local para reflejar el cambio inmediatamente
    setCartas(prev => 
      prev.map(carta => 
        carta.id === id 
          ? { ...carta, ...cartaActualizada } 
          : carta
      )
    );

    console.log('✅ Carta actualizada:', cartaActualizada);
    alert('✅ Carta actualizada correctamente.');
  } catch (error) {
    console.error('❌ Error al actualizar carta:', error);
    let mensaje = 'Error al actualizar la carta.';
    if (error.messages) {
      // Errores de validación
      const mensajes = Object.entries(error.messages)
        .map(([campo, arr]) => `- ${campo}: ${arr.join(', ')}`)
        .join('\n');
      mensaje = `Errores de validación:\n${mensajes}`;
    } else if (error.message) {
      mensaje = error.message;
    }
    alert(`❌ ${mensaje}`);
    throw error; // Opcional: relanzar para manejo superior
  }
};


  // ✅ EDICIÓN: Guardar producto editado
  const handleGuardarProductoEditado = async (id, datos) => {
    try {
      await menuApi.actualizarProductoCarta(id, datos);
      const productos = await menuApi.getProductosCarta();
      setProductosGlobales(productos);
      setProductosCarta(productos);
      setShowEditarProductoModal(false);
      alert('✅ Producto actualizado correctamente');
    } catch (error) {
      console.error('Error al editar producto:', error);
      alert('❌ Error al actualizar el producto: ' + (error.message || 'Verifica la consola'));
    }
  };

  // ✅ EDICIÓN: Guardar combo editado
  const handleGuardarComboEditado = async (id, datos) => {
    try {
      await menuApi.actualizarCombo(id, datos);
      const combosActualizados = await menuApi.getCombos();
      setCombos(combosActualizados);
      setShowEditarComboModal(false);
      alert('✅ Combo actualizado correctamente');
    } catch (error) {
      console.error('Error al editar combo:', error);
      alert('❌ Error al actualizar el combo: ' + (error.message || 'Verifica la consola'));
    }
  };

    // ✅ EDICIÓN: Guardar subpantalla editada
const handleGuardarSubpantallaEditada = async (id, datos) => {
  try {
    // ✅ Usa la función de menuApi
    const subpantallaActualizada = await menuApi.actualizarPantalla(id, datos);

    // Actualizar estado local
    setPantallas(prev => prev.map(p => p.id === id ? subpantallaActualizada : p));
    setSubpantallas(prev => prev.map(p => p.id === id ? subpantallaActualizada : p));

    setShowEditarSubpantallaModal(false);
    alert('✅ Subpantalla actualizada correctamente');
  } catch (error) {
    console.error('Error al actualizar subpantalla:', error);
    let mensaje = '❌ Error al actualizar la subpantalla.';
    if (error.messages) {
      // Errores de validación
      const mensajesDetallados = Object.entries(error.messages)
        .map(([campo, arr]) => `- ${campo}: ${arr.join(', ')}`)
        .join('\n');
      mensaje = `Errores de validación:\n${mensajesDetallados}`;
    } else if (error.message) {
      mensaje += ' ' + error.message;
    }
    alert(mensaje);
  }
};


  // Eliminar producto
  const handleEliminarProducto = async (id) => {
    try {
      await menuApi.eliminarProductoCarta(id);
      const productos = await menuApi.getProductosCarta();
      setProductosGlobales(productos);
      setProductosCarta(productos);
      alert('✅ Producto eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('❌ Error al eliminar el producto');
    }
  };

  // Eliminar combo
  const handleEliminarCombo = async (id) => {
    try {
      await menuApi.eliminarCombo(id);
      const combosActualizados = await menuApi.getCombos();
      setCombos(combosActualizados);
      alert('✅ Combo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar combo:', error);
      alert('❌ Error al eliminar el combo');
    }
  };

  // ✅ ELIMINACIÓN: Preparar para eliminar carta
  const handlePrepararEliminarCarta = (carta) => {
    if (carta.estado === 'activa') {
      alert('⚠️ No se puede eliminar una carta activa. Debes desactivarla primero.');
      return;
    }
    setCartaAEliminar(carta);
    setShowEliminarCartaModal(true);
  };

  // ✅ ELIMINACIÓN: Confirmar eliminar carta
  const handleEliminarCartaConfirmada = async () => {
    if (!cartaAEliminar) return;

    try {
      await menuApi.eliminarCarta(cartaAEliminar.id);
      setCartas(prev => prev.filter(c => c.id !== cartaAEliminar.id));
      if (cartaAEliminar.id === cartaSeleccionada) {
        setCartaSeleccionada(null);
        setPantallaSeleccionada(null);
        setBotones([...BOTONES_VACIOS]);
        setPantallas([]);
        setSubpantallas([]);
      }
      alert('✅ Carta eliminada correctamente.');
      setShowEliminarCartaModal(false);
      setCartaAEliminar(null);
    } catch (error) {
      console.error('Error al eliminar carta:', error);
      alert('❌ Error al eliminar la carta: ' + (error.message || 'Verifica la consola'));
    }
  };

  // ✅ ELIMINACIÓN: Preparar para eliminar subpantalla
  const handlePrepararEliminarSubpantalla = (subpantalla) => {
    setSubpantallaAEliminar(subpantalla);
    setShowEliminarSubpantallaModal(true);
  };

  // ✅ ELIMINACIÓN: Confirmar eliminar subpantalla
  const handleEliminarSubpantallaConfirmada = async () => {
    if (!subpantallaAEliminar) return;

    try {
      await menuApi.eliminarPantalla(subpantallaAEliminar.id);

      // Actualizar estado local
      setPantallas(prev => prev.filter(p => p.id !== subpantallaAEliminar.id));
      setSubpantallas(prev => prev.filter(p => p.id !== subpantallaAEliminar.id));

      // Si la subpantalla eliminada era la seleccionada, limpiar selección
      if (pantallaSeleccionada === subpantallaAEliminar.id) {
          setPantallaSeleccionada(null);
          setBotones([...BOTONES_VACIOS]);
      }

      alert('✅ Subpantalla eliminada correctamente.');
      setShowEliminarSubpantallaModal(false);
      setSubpantallaAEliminar(null);
    } catch (error) {
      console.error('Error al eliminar subpantalla:', error);
      alert('❌ Error al eliminar la subpantalla: ' + (error.message || 'Verifica la consola'));
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Grid3x3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestor de Menú</h1>
                  <p className="text-sm text-gray-500">Cada carta es independiente</p>
                </div>
              </div>
            </div>
            
            {usuario && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-100">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {obtenerInicialUsuario()}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Usuario activo</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {obtenerNombreUsuario()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-full mx-auto p-6 h-[calc(100vh-120px)] overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
          {/* Panel Izquierdo */}
          <div className="w-80 space-y-4 overflow-y-auto flex-shrink-0" style={{ maxHeight: '100%' }}>
            {/* Sección Cartas */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Cartas</h2>
                  </div>
                  {/* Botón de "Editar" junto al nombre de la carta seleccionada */}
                  {cartaSeleccionada && (
                    <button
                      onClick={() => {
                        const cartaActual = cartas.find(c => c.id === cartaSeleccionada);
                        if (cartaActual) handleEditarCarta(cartaActual);
                      }}
                      className="text-white hover:text-blue-200 transition-colors text-sm flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" /> Editar
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Alerta si no hay carta activa */}
                {cartas.length > 0 && !cartas.some(c => c.estado === 'activa') && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">Sin carta activa</p>
                        <p className="text-xs text-amber-700 mt-1">Debes activar una carta para trabajar</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Layout className="w-4 h-4 text-blue-600" />
                    Carta Seleccionada
                  </label>
                  <select
                    value={cartaSeleccionada || ''}
                    onChange={(e) => setCartaSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-blue-300 cursor-pointer font-medium"
                    disabled={loading}
                  >
                    <option value="">Seleccionar carta...</option>
                    {cartas.map(carta => (
                      <option key={carta.id} value={carta.id}>
                        {carta.nombre} • {carta.estado === 'activa' ? '✓ ACTIVA' : 'Inactiva'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botones de acción para la carta seleccionada */}
                {cartaSeleccionada && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Acciones de Carta:</p>
                    {cartas.find(c => c.id === cartaSeleccionada)?.estado === 'inactiva' ? (
                      <button
                        onClick={handleActivarCarta}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Activar Carta</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleDesactivarCarta}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Desactivar Carta</span>
                      </button>
                    )}
                    {/* Botón de Eliminar (solo si es inactiva) */}
                    {cartas.find(c => c.id === cartaSeleccionada)?.estado === 'inactiva' && (
                      <button
                        onClick={() => handlePrepararEliminarCarta(cartas.find(c => c.id === cartaSeleccionada))}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar Carta</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setShowCrearCartaModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Nueva Carta</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sección Pantallas */}
            {cartaSeleccionada && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Layout className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-white">Pantallas</h2>
                    </div>
                    {/* Botón de "Editar" junto al nombre de la pantalla seleccionada */}
                    {pantallaSeleccionada && (
                      <button
                        onClick={() => {
                          const pantallaActual = pantallas.find(p => p.id === pantallaSeleccionada);
                          if (pantallaActual && !pantallaActual.es_principal) { // Solo editar subpantallas
                            handleEditarSubpantalla(pantallaActual);
                          }
                        }}
                        className="text-white hover:text-purple-200 transition-colors text-sm flex items-center gap-1"
                        disabled={!pantallaSeleccionada || pantallas.find(p => p.id === pantallaSeleccionada)?.es_principal} // Deshabilitar si es principal
                      >
                        <Edit3 className="w-4 h-4" /> Editar
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Layout className="w-4 h-4 text-purple-600" />
                      Pantalla Activa
                    </label>
                    <select
                      value={pantallaSeleccionada || ''}
                      onChange={(e) => setPantallaSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-purple-300 cursor-pointer font-medium"
                      disabled={loading}
                    >
                      <option value="">Seleccionar pantalla...</option>
                      {pantallas.map(pantalla => (
                        <option key={pantalla.id} value={pantalla.id}>
                          {pantalla.nombre} {pantalla.es_principal ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2"> {/* Cambiado a flexbox para botones lado a lado */}
                    <button
                      onClick={() => setShowCrearSubpantallaModal(true)}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                      <div className="text-xs mt-1">Crear Subpantalla</div>
                    </button>
                    {/* Botón de Eliminar Subpantalla (solo si no es principal y está seleccionada) */}
                    {pantallaSeleccionada && !pantallas.find(p => p.id === pantallaSeleccionada)?.es_principal && (
                      <button
                        onClick={() => handlePrepararEliminarSubpantalla(pantallas.find(p => p.id === pantallaSeleccionada))}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                        <div className="text-xs mt-1">Eliminar Pantalla</div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sección Listados */}
            {pantallaSeleccionada && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Listados</h2>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => setShowListaProductosCarta(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Package className="w-4 h-4" />
                    <span>Listar Productos Carta</span>
                  </button>
                  <button
                    onClick={() => setShowListaCombos(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Package className="w-4 h-4" />
                    <span>Listar Combos</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho - Grid */}
          <div className="flex-1 min-h-0 min-w-0 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col" style={{ minWidth: '32cm' }}>
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      {pantallaSeleccionada ? (
                        <>
                          <span className="text-2xl">📋</span>
                          {pantallas.find(p => p.id === pantallaSeleccionada)?.nombre || 'Sin nombre'}
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">🎯</span>
                          Selecciona una configuración
                        </>
                      )}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {pantallaSeleccionada 
                        ? 'Haz clic en cualquier botón para editarlo o configurarlo'
                        : 'Elige una carta y pantalla del panel lateral para comenzar'}
                    </p>
                  </div>
                  {/* ✅ ELIMINADO: botón "Guardar Pantalla" */}
                </div>
              </div>
              <div className="p-8 overflow-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Cargando...</p>
                    </div>
                  </div>
                ) : pantallaSeleccionada ? (
                  <div className="flex justify-center min-h-full">
                    <BotonGrid 
                      botones={botones} 
                      onEdit={handleEditarBoton}
                      onUpdateBoton={handleUpdateBoton}
                      onUpdateSingleBoton={handleUpdateSingleBoton}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-200 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                      <Grid3x3 className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Comienza a configurar</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      Selecciona una carta y una pantalla del panel lateral para comenzar a editar los botones del menú
                    </p>
                    <p className="text-blue-600 font-medium bg-blue-50 rounded-xl px-4 py-2">
                      💡 Tip: Primero crea una carta, luego una pantalla, y finalmente configura los botones
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Editar Botón */}
     {modalOpen && posicionEdit && (
  <BotonModal
    isOpen={true}
    onClose={() => setModalOpen(false)}
    posicion={posicionEdit}
    initialData={botones.find(b => b.posicion === posicionEdit)}
    onSave={handleGuardarBoton}
    productos={productosGlobales}
    combos={combos}
    // ✅ PASAR AMBAS: subpantallas (completa) + subpantallasDisponibles (filtrada)
    subpantallas={subpantallas}
    subpantallasDisponibles={getSubpantallasDisponibles()}
    onCreatePlatillo={handleCrearPlatilloDesdeBoton}
    onCreateCombo={handleCrearComboDesdeBoton}
    productosInventario={productosInventario}
  />
)}

      {/* Modal: Listar Productos Carta */}
      {showListaProductosCarta && (
        <ListarProductosModal
          isOpen={true}
          onClose={() => setShowListaProductosCarta(false)}
          productos={productosGlobales}
          onVerDetalle={(producto) => {
            setProductoSeleccionado(producto);
            setShowDetalleProducto(true);
          }}
          onEditar={handleEditarProducto}
          onEliminar={handleEliminarProducto}
        />
      )}

      {/* Modal: Listar Combos */}
      {showListaCombos && (
        <ListarCombosModal
          isOpen={true}
          onClose={() => setShowListaCombos(false)}
          combos={combos}
          productos={productosGlobales}
          onVerDetalle={(combo) => {
            setComboSeleccionado(combo);
            setShowDetalleCombo(true);
          }}
          onEditar={handleEditarCombo}
          onEliminar={handleEliminarCombo}
        />
      )}

      {/* Modal: Detalle Producto */}
      {showDetalleProducto && productoSeleccionado && (
        <DetalleProductoModal
          isOpen={true}
          onClose={() => {
            setShowDetalleProducto(false);
            setProductoSeleccionado(null);
          }}
          producto={productoSeleccionado}
        />
      )}

      {/* Modal: Detalle Combo */}
      {showDetalleCombo && comboSeleccionado && (
        <DetalleComboModal
          isOpen={true}
          onClose={() => {
            setShowDetalleCombo(false);
            setComboSeleccionado(null);
          }}
          combo={comboSeleccionado}
          productos={productosGlobales}
        />
      )}

      {/* Modal: Crear Carta */}
      {showCrearCartaModal && (
        <CrearCartaModal
          isOpen={true}
          onClose={() => setShowCrearCartaModal(false)}
          onCrear={handleCrearCarta}
        />
      )}

      {/* Modal: Crear Subpantalla */}
      {showCrearSubpantallaModal && (
        <CrearSubpantallaModal
          isOpen={true}
          onClose={() => setShowCrearSubpantallaModal(false)}
          onCrear={handleCrearSubpantalla}
          cartaId={cartaSeleccionada}
        />
      )}

      {/* ✅ MODALES DE EDICIÓN */}
      {showEditarProductoModal && productoAEditar && (
        <EditarProductoModal
          isOpen={true}
          onClose={() => {
            setShowEditarProductoModal(false);
            setProductoAEditar(null);
          }}
          initialData={productoAEditar}
          onSave={handleGuardarProductoEditado}
          productosInventario={productosInventario}
        />
      )}

      {showEditarComboModal && comboAEditar && (
        <EditarComboModal
          isOpen={true}
          onClose={() => setShowEditarComboModal(false)}
          combo={comboAEditar}
          productos={productosGlobales}
          onSave={handleGuardarComboEditado}
        />
      )}

      {showEditarSubpantallaModal && subpantallaAEditar && (
        <EditarSubpantallaModal
          isOpen={true}
          onClose={() => {
            setShowEditarSubpantallaModal(false);
            setSubpantallaAEditar(null);
          }}
          subpantalla={subpantallaAEditar}
          onSave={handleGuardarSubpantallaEditada}
        />
      )}

      {/* ✅ MODALES DE CONFIRMACIÓN DE ELIMINACIÓN */}

      {/* Confirmar Eliminar Carta */}
      {showEliminarCartaModal && cartaAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Confirmar Eliminación
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar la carta <strong>"{cartaAEliminar.nombre}"</strong>?<br />
                Esta acción eliminará también todas las subpantallas y botones asociados.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEliminarCartaModal(false);
                    setCartaAEliminar(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarCartaConfirmada}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar Eliminar Subpantalla */}
      {showEliminarSubpantallaModal && subpantallaAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Confirmar Eliminación
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar la subpantalla <strong>"{subpantallaAEliminar.nombre}"</strong>?<br />
                Esta acción eliminará también todos los botones asociados a esta subpantalla.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEliminarSubpantallaModal(false);
                    setSubpantallaAEliminar(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarSubpantallaConfirmada}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
