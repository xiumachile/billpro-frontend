import React, { useState, useEffect } from 'react';
import { Palette, Type, X, ChevronRight, Layers, Package } from 'lucide-react';

// Paleta de colores predefinida
const PALETA_COLORES = {
  blanco: { nombre: 'Blanco', valor: '#ffffff' },
  negro: { nombre: 'Negro', valor: '#000000' },
  rojo: { nombre: 'Rojo', valor: '#ef4444' },
  naranjo: { nombre: 'Naranjo', valor: '#f97316' },
  azul: { nombre: 'Azul', valor: '#3b82f6' },
  verde: { nombre: 'Verde', valor: '#22c55e' },
};

// Mapeo de tamaños
const SIZE_MAP = {
  'extra-small': 'text-xs', 'small': 'text-sm', 'medium': 'text-base',
  'large': 'text-lg', 'extra-large': 'text-xl', 'xxl': 'text-2xl', 'xxxl': 'text-3xl'
};

const getFontSizeClass = (size) => SIZE_MAP[size] || size || 'text-sm';

export default function BotonItem({
  posicion,
  data,
  onClick, // Abre el modal de edición principal (BotonModal)
  onUpdateBoton, // Actualiza estado en el padre
  onUpdateSingleBoton, // Guarda en BD
  modoTomaPedido = false,
  onAgregarAlPedido,
  onNavegacionSubpantalla
}) {
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  // Estados temporales para preview
  const [tempBgColor, setTempBgColor] = useState(data?.bg_color || '#f3f4f6');
  const [tempTextColor, setTempTextColor] = useState(data?.text_color || '#374151');
  const [tempFontSize, setTempFontSize] = useState(data?.font_size || 'text-sm');

  // Sincronizar cuando cambia la data externa (al guardar)
  useEffect(() => {
    setTempBgColor(data?.bg_color || '#f3f4f6');
    setTempTextColor(data?.text_color || '#374151');
    setTempFontSize(data?.font_size || 'text-sm');
  }, [data]);

  const isActive = data?.activo !== false;
  const tipo = (data?.tipo || '').toLowerCase();
  const esPantalla = tipo === 'pantalla' || tipo === 'link';
  const esCombo = tipo === 'combo';

  // Manejador Principal de Click
  const handleClick = (e) => {
    e.stopPropagation();
    
    // MODO POS: Ejecutar acción de venta/navegación
    if (modoTomaPedido) {
      if (!isActive) return;
      
      // Reproducir sonido si quieres
      try { new Audio('/sounds/click.mp3').play().catch(()=>{}); } catch(e){}

      if (esPantalla) {
        if (onNavegacionSubpantalla) onNavegacionSubpantalla(data.referencia_id);
      } else {
        if (onAgregarAlPedido) onAgregarAlPedido(data);
      }
    } 
    // MODO EDICIÓN: Abrir modal de configuración
    else {
      if (onClick) onClick(posicion);
    }
  };

  // --- LÓGICA DE GUARDADO DE ESTILOS (Colores/Fuentes) ---
  const handleSaveStyle = async (updates) => {
    // Actualización optimista local
    if (updates.bg_color) setTempBgColor(updates.bg_color);
    if (updates.text_color) setTempTextColor(updates.text_color);
    if (updates.font_size) setTempFontSize(updates.font_size);

    // Guardado en BD y Padre
    if (onUpdateSingleBoton) {
      try {
        await onUpdateSingleBoton(posicion, {
          ...data,
          ...updates,
          activo: isActive // Mantener estado activo
        });
      } catch (error) { console.error(error); }
    }
    
    // Cerrar modales
    setShowColorPalette(false);
    setShowFontSizePicker(false);
  };

  // --- CLASES RESPONSIVAS PARA EL BOTÓN ---
  // Esto asegura que se vea bien en celular (rectangular) y PC (cuadrado/auto)
  const btnClasses = `
    relative w-full flex flex-col items-center justify-center p-1.5 rounded-xl border shadow-sm transition-all select-none
    aspect-[4/3] md:aspect-square lg:aspect-auto lg:h-28
    ${isActive ? 'cursor-pointer active:scale-95 hover:opacity-90' : 'opacity-50 cursor-default border-dashed'}
    ${esPantalla ? 'border-blue-300' : 'border-gray-300'}
  `;

  return (
    <>
      <div 
        onClick={handleClick}
        className={btnClasses}
        style={{ backgroundColor: isActive ? tempBgColor : '#f9fafb' }}
      >
        {/* Indicadores de Tipo */}
        {isActive && esPantalla && (
          <div className="absolute top-1 right-1 bg-blue-200 text-blue-700 p-0.5 rounded-full shadow-sm">
            <ChevronRight size={14} strokeWidth={3} />
          </div>
        )}
        {isActive && esCombo && (
          <span className="absolute top-1 left-1 text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
            <Layers size={10}/> Combo
          </span>
        )}

        {/* Texto del Botón */}
        <span
          className={`${getFontSizeClass(tempFontSize)} font-bold text-center px-1 break-words leading-tight line-clamp-3`}
          style={{ 
            color: isActive ? tempTextColor : '#9ca3af',
            fontFamily: 'Arial, sans-serif' 
          }}
        >
          {isActive ? (data?.etiqueta || 'Sin Nombre') : ''}
        </span>

        {/* --- HERRAMIENTAS DE EDICIÓN FLOTANTES (Solo en Modo Edición y si Activo) --- */}
        {!modoTomaPedido && isActive && (
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setShowColorPalette(true); }}
              className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow hover:bg-gray-50 text-gray-700"
              title="Colores"
            >
              <Palette size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowFontSizePicker(true); }}
              className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow hover:bg-gray-50 text-gray-700"
              title="Fuente"
            >
              <Type size={14} />
            </button>
          </div>
        )}
      </div>

      {/* --- MODALES INTERNOS DE EDICIÓN --- */}
      
      {/* 1. Modal Colores */}
      {showColorPalette && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => {e.stopPropagation(); setShowColorPalette(false)}}>
          <div className="bg-white rounded-2xl p-4 w-full max-w-xs shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Estilo Botón #{posicion}</h3>
              <button onClick={() => setShowColorPalette(false)}><X size={18}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Fondo</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(PALETA_COLORES).map((c) => (
                    <button key={'bg'+c.valor} onClick={() => handleSaveStyle({ bg_color: c.valor })} 
                      className="w-full h-8 rounded border shadow-sm" style={{ backgroundColor: c.valor }} title={c.nombre} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Texto</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(PALETA_COLORES).map((c) => (
                    <button key={'txt'+c.valor} onClick={() => handleSaveStyle({ text_color: c.valor })} 
                      className="w-full h-8 rounded border shadow-sm flex items-center justify-center font-bold text-xs" 
                      style={{ backgroundColor: '#f0f0f0', color: c.valor }}>A</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Fuente */}
      {showFontSizePicker && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => {e.stopPropagation(); setShowFontSizePicker(false)}}>
          <div className="bg-white rounded-2xl p-4 w-full max-w-xs shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Tamaño Fuente</h3>
              <button onClick={() => setShowFontSizePicker(false)}><X size={18}/></button>
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
              {Object.keys(SIZE_MAP).map((k) => (
                <button key={k} onClick={() => handleSaveStyle({ font_size: k })} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${tempFontSize === k ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}>
                   <span className={SIZE_MAP[k]}>Texto Ejemplo</span> 
                   <span className="text-xs text-gray-400 ml-2">({k})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
