import { menuApi } from '../api/menuApi';
import EscPosEncoder from 'esc-pos-encoder';

// Importación dinámica para Tauri (evita crash en web)
const invoke = window.__TAURI__ ? window.__TAURI__.invoke : null;

class PrintService {
  
  constructor() {
    // Estilos CSS para el modo Web/PDF
    this.styles = `
      <style>
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 5px; width: 80mm; color: #000; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-xl { font-size: 18px; }
        .text-2xl { font-size: 22px; }
        .text-sm { font-size: 10px; }
        .border-top { border-top: 1px dashed #000; }
        .border-bottom { border-bottom: 1px dashed #000; }
        .flex { display: flex; justify-content: space-between; }
        .my-2 { margin: 8px 0; }
      </style>
    `;
  }

  /**
   * Método principal para imprimir Tickets (Pago / Cuenta)
   */
  async imprimirTicket(pedido, impresoraForzadaNombre = null) {
    try {
      console.log("🖨️ Iniciando impresión para pedido #", pedido.id);

      // 1. Obtener Configuración de Ticket
      let configTicket = {};
      try {
          const res = await menuApi.getConfiguracionTicket();
          configTicket = res.data || res || {};
      } catch (e) { console.warn("Usando config ticket default"); }

      // 2. DETECTAR ENTORNO
      if (window.__TAURI__) {
          // --- MODO ESCRITORIO (Tauri/Rust) ---
          
          let configImpresora = null;
          
          if (impresoraForzadaNombre) {
              // Caso especial: Prueba de conexión
              configImpresora = { 
                  tipo_conexion: impresoraForzadaNombre.includes('.') ? 'red' : 'usb', 
                  puerto_uri: impresoraForzadaNombre, 
                  ip: impresoraForzadaNombre, 
                  puerto: '9100'
              };
          } else {
              // Caso Normal: Buscar impresora de 'Caja' o 'Ticket'
              // Intenta buscar primero por 'Caja', luego 'Ticket'
              configImpresora = await this._obtenerConfiguracionImpresora('Caja') 
                             || await this._obtenerConfiguracionImpresora('Ticket');
          }

          if (!configImpresora && !impresoraForzadaNombre) {
              console.warn("⚠️ No se encontró impresora para Caja/Ticket. Usando primera disponible.");
              // Fallback: Usar la primera activa que encuentre
              const todas = await menuApi.getImpresoras();
              const lista = Array.isArray(todas.data) ? todas.data : [];
              configImpresora = lista.find(i => i.estado === 'Activa');
          }

          if (!configImpresora) return alert("⚠️ No hay ninguna impresora configurada.");

          // Generar Bytes y Enviar
          const bytesBase64 = this._generarEscPosTicket(pedido, configTicket);
          await this._enviarARust(configImpresora, bytesBase64);

      } else {
          // --- MODO WEB (PWA) ---
          const htmlContent = this._generarHtmlTicket(pedido, configTicket);
          this._lanzarVentanaImpresion(htmlContent);
      }

    } catch (error) {
      console.error("Error al imprimir ticket:", error);
      alert("Error de impresión: " + error.message);
    }
  }

  /**
   * Imprimir Comanda de Cocina/Barra desde el JSON de la cola (PrintMonitor)
   */
  async imprimirComandaDesdeJson(jsonContent, zona) {
      if (!window.__TAURI__) return; // Solo caja física imprime comandas

      console.log(`🖨️ Procesando comanda para zona: ${zona}`);

      // 1. Buscar impresora de la zona específica
      const configImpresora = await this._obtenerConfiguracionImpresora(zona);
      
      if (!configImpresora) {
          return console.warn(`⚠️ No hay impresora configurada para la zona: ${zona}`);
      }

      // 2. Generar ESC/POS
      const encoder = new EscPosEncoder();
      let ticket = encoder
          .initialize()
          .codepage('cp850')
          .align('center')
          .bold(true)
          .size(1, 1)
          .text(jsonContent.titulo) // "NUEVO PEDIDO"
          .newline()
          .text(jsonContent.numero_mesa) // "MESA 5"
          .size(0, 0)
          .bold(false)
          .newline()
          .text(`Mozo: ${jsonContent.mozo} - ${jsonContent.fecha}`)
          .newline()
          .line('--------------------------------')
          .align('left');

      jsonContent.items.forEach(item => {
          ticket
            .bold(true)
            .size(1, 1) // Doble tamaño para lectura fácil en cocina
            .text(`${item.cantidad} x ${item.producto}`)
            .newline()
            .size(0, 0)
            .bold(false);
            
          if (item.nota) {
              ticket.text(`   *** ${item.nota} ***`).newline();
          }
          ticket.newline();
      });

      ticket
          .newline()
          .newline()
          .cut();

      // 3. Enviar a Rust
      const bytes = ticket.encode();
      const base64 = this._arrayBufferToBase64(bytes);
      
      await this._enviarARust(configImpresora, base64);
  }

  /**
   * Obtener lista de impresoras físicas (Solo Tauri)
   */
  async obtenerImpresorasSistema() {
      if (!window.__TAURI__) return [];
      try {
          return await invoke('listar_impresoras_sistema');
      } catch (e) {
          console.error("Error listando impresoras:", e);
          return [];
      }
  }

  // ==========================================
  // HELPERS INTERNOS
  // ==========================================

  async _obtenerConfiguracionImpresora(zonaBuscada) {
      try {
          const res = await menuApi.getImpresoras(); 
          const lista = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          
          // Buscamos coincidencia insensible a mayúsculas
          // Puede coincidir por 'nombre' (ej: "Cocina Caliente") o por 'tipo_impresora' (ej: "Cocina")
          return lista.find(i => 
              i.estado === 'Activa' && (
                  (i.nombre && i.nombre.toLowerCase() === zonaBuscada.toLowerCase()) ||
                  (i.tipo_impresora && i.tipo_impresora.toLowerCase() === zonaBuscada.toLowerCase())
              )
          );
      } catch (e) {
          console.error("Error buscando config impresora", e);
          return null;
      }
  }

  async _enviarARust(config, base64Bytes) {
      try {
          if (config.tipo_conexion === 'red') {
              console.log(`📡 Enviando vía TCP a ${config.ip}:${config.puerto || 9100}`);
              await invoke('imprimir_ticket_tcp', { 
                  ip: config.ip,
                  puerto: config.puerto || "9100",
                  contenidoBase64: base64Bytes 
              });
          } else {
              console.log(`🔌 Enviando vía Driver a: ${config.puerto_uri}`);
              await invoke('imprimir_ticket_nativo', { 
                  impresora: config.puerto_uri, 
                  contenidoBase64: base64Bytes 
              });
          }
          console.log("✅ Impresión exitosa");
      } catch (error) {
          console.error("❌ Falló la impresión en Rust:", error);
          alert("Error de impresora: " + error);
      }
  }

  // --- GENERADORES DE CONTENIDO ---

  _generarEscPosTicket(pedido, config) {
      const encoder = new EscPosEncoder();
      const fecha = new Date().toLocaleString('es-CL');
      
      let ticket = encoder
          .initialize()
          .codepage('cp850')
          .align('center')
          .bold(true)
          .line(config.restaurante_nombre || 'BILLPRO RESTAURANT')
          .bold(false)
          .line(config.restaurante_direccion || '')
          .line(config.restaurante_telefono || '')
          .line('--------------------------------')
          .align('left')
          .line(`Orden:   ${pedido.codigo_visual || '#' + pedido.id}`)
          .line(`Fecha:   ${fecha}`)
          .line(`Atiende: ${pedido.mozo?.nombre_completo || 'Cajero'}`)
          .line('--------------------------------');

      // Items
      const items = [...(pedido.items || []), ...(pedido.combos || [])];
      items.forEach(item => {
          const nombre = item.nombre || item.producto?.nombre || item.combo?.nombre || 'Item';
          const cant = item.cantidad;
          const precio = item.precio_unitario || item.precio || 0;
          const total = Math.round(cant * precio);
          
          ticket
            .text(`${cant} x ${nombre.substring(0, 20)}`) 
            .align('right')
            .line(`$${total.toLocaleString('es-CL')}`)
            .align('left');
      });

      ticket.line('--------------------------------');

      // Totales
      const total = Math.round(parseFloat(pedido.total));
      const desc = Math.round(parseFloat(pedido.descuento || 0));
      const prop = Math.round(parseFloat(pedido.propina || 0));
      // Recalcular total final por seguridad visual
      const final = total - desc + prop;

      ticket.align('right');
      ticket.line(`Subtotal: $${total.toLocaleString('es-CL')}`);
      if(desc > 0) ticket.line(`Descuento: -$${desc.toLocaleString('es-CL')}`);
      if(prop > 0) ticket.line(`Propina: +$${prop.toLocaleString('es-CL')}`);
      
      ticket
          .bold(true)
          .size(1, 1)
          .line(`TOTAL: $${final.toLocaleString('es-CL')}`)
          .size(0, 0)
          .bold(false);

      // Formas de Pago
      if (pedido.pagos && pedido.pagos.length > 0) {
          ticket.line('--------------------------------').align('left');
          pedido.pagos.forEach(p => {
              const nombrePago = p.nombre_forma || p.forma_pago?.nombre || 'Pago';
              ticket.text(`${nombrePago}: $${Math.round(p.monto).toLocaleString('es-CL')}`).newline();
          });
          if (pedido.vuelto > 0) {
              ticket.text(`Vuelto: $${Math.round(pedido.vuelto).toLocaleString('es-CL')}`).newline();
          }
      }

      ticket
          .newline()
          .align('center')
          .line(config.mensaje_pie || '¡Gracias por su visita!')
          .newline()
          .newline()
          .cut();

      const bytes = ticket.encode();
      return this._arrayBufferToBase64(bytes);
  }

  // Generador HTML (Para Web/PWA)
  _generarHtmlTicket(pedido, config) {
      const formatMoney = (amount) => `$ ${Math.round(amount).toLocaleString('es-CL')}`;
      const fecha = new Date().toLocaleString('es-CL');
      const total = parseFloat(pedido.total) || 0;
      const desc = parseFloat(pedido.descuento) || 0;
      const prop = parseFloat(pedido.propina) || 0;
      const final = total - desc + prop;

      let html = `<html><head>${this.styles}</head><body>`;
      html += `<div class="text-center font-bold text-xl my-2">${config.restaurante_nombre || 'TICKET'}</div>`;
      html += `<div class="text-center text-sm">${config.restaurante_direccion || ''}</div>`;
      html += `<div class="border-bottom my-2"></div>`;
      
      html += `<div class="flex"><span>Fecha:</span> <span>${fecha}</span></div>`;
      html += `<div class="flex"><span>Orden:</span> <span>${pedido.codigo_visual || '#' + pedido.id}</span></div>`;
      
      html += `<div class="border-bottom my-2"></div>`;
      
      const items = [...(pedido.items || []), ...(pedido.combos || [])];
      items.forEach(item => {
          const nombre = item.nombre || item.producto?.nombre || 'Item';
          const totalItem = Math.round(item.cantidad * (item.precio_unitario || item.precio));
          html += `<div class="flex"><span>${item.cantidad} x ${nombre}</span><span>${formatMoney(totalItem)}</span></div>`;
      });
      
      html += `<div class="border-bottom my-2"></div>`;
      
      html += `<div class="flex font-bold"><span>Total:</span> <span>${formatMoney(total)}</span></div>`;
      if (desc > 0) html += `<div class="flex text-red-600"><span>Desc:</span> <span>-${formatMoney(desc)}</span></div>`;
      if (prop > 0) html += `<div class="flex text-green-600"><span>Propina:</span> <span>+${formatMoney(prop)}</span></div>`;
      
      html += `<div class="flex text-xl font-black my-2"><span>PAGAR:</span> <span>${formatMoney(final)}</span></div>`;
      
      html += `<div class="text-center mt-4">Gracias por su preferencia</div>`;
      html += `</body></html>`;
      return html;
  }

  _lanzarVentanaImpresion(htmlContent) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(htmlContent); doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }

  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export default new PrintService();
