import React from 'react';
import BotonItem from './BotonItem';

const TOTAL_BOTONES = 35;

export default function BotonGrid({ 
  botones, 
  onEdit,                 // Para abrir el modal de edición (CartaManager)
  onUpdateBoton,          // Para actualización en tiempo real (Preview)
  onUpdateSingleBoton,    // Para guardar cambios individuales
  modoTomaPedido = false, // false = Modo Edición, true = Modo POS
  onAgregarAlPedido = null, 
  onNavegacionSubpantalla = null 
}) {

  // --- CLASES RESPONSIVAS PARA LA REJILLA ---
  // Móvil: 3 columnas | Tablet: 4-5 | PC: 6-8
  const gridClasses = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2 pb-32 md:pb-2";

  return (
    <div className="h-full w-full overflow-y-auto safe-area-pb custom-scrollbar bg-gray-50 touch-pan-y">
      <div className={gridClasses}>
        {Array.from({ length: TOTAL_BOTONES }, (_, i) => {
          const posicion = i + 1;
          // Buscar datos del botón o usar default
          const botonData = botones.find(b => b.posicion === posicion) || { 
            posicion,
            activo: false, 
            bg_color: '#f3f4f6', 
            text_color: '#374151',
            font_size: 'text-sm',
            etiqueta: '' 
          };
          
          return (
            <div key={posicion} className="relative group w-full">
              <BotonItem
                posicion={posicion}
                data={botonData}
                modoTomaPedido={modoTomaPedido}
                // Eventos de Acción (POS)
                onAgregarAlPedido={onAgregarAlPedido}
                onNavegacionSubpantalla={onNavegacionSubpantalla}
                // Eventos de Edición (CartaManager)
                onClick={() => onEdit && onEdit(posicion)}
                onUpdateSingleBoton={onUpdateSingleBoton}
                onUpdateBoton={onUpdateBoton} // Pasamos la función de actualización padre
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
