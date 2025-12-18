import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Diccionario de Traducciones UNIFICADO
const translations = {
  es: {
    // Generales
    welcome: "Bienvenido",
    settings: "Configuración",
    save: "Guardar",
    cancel: "Cancelar",
    language: "Idioma",
    screen_lock: "Bloqueo de Pantalla",
    screen_lock_desc: "Volver al Login después de confirmar un pedido (Ideal para múltiples mozos en un mismo terminal).",

    // Dashboard General
    dashboard_user: "👤 {{nombre}}",
    dashboard_role: "{{rol}}",
    dashboard_pos_id: "🖥️ POS-01",
    dashboard_current_time: "🕐 {{hora}}",
    dashboard_title: "Sistema de Gestión de Restaurante",
    dashboard_logo: "BILLPRO",

    // Estado de Caja
    caja_mi_abierta: "🟢 Mi Caja Abierta",
    caja_abierta_otro: "🔵 Caja Abierta ({{nombreCajero}})",
    caja_cerrada: "🔴 Caja Cerrada",

    // Botones de Caja
    caja_btn_movimiento: "MOVIMIENTO",
    caja_btn_cerrar_turno: "CERRAR TURNO",
    caja_btn_abrir_otra: "+ Abrir Otra",
    caja_btn_abrir_ahora: "ABRIR CAJA AHORA",

    // Menú Principal
    menu_salir: "Salir",
    menu_reimprimir_cuenta: "Reimprimir Cuenta",
    menu_reportes_ventas: "Reportes Ventas",
    menu_gastos_op: "Gastos Op.",
    menu_balance: "Balance",
    menu_gestion_carta: "Gestión de Carta",
    menu_inventario: "Inventario",
    menu_clientes: "Clientes",
    menu_parametros: "Parámetros",
    menu_gestion_usuario: "Gestión Usuario",
    menu_delivery: "Delivery",
    menu_para_llevar: "Para Llevar",
    menu_gestion_mesas: "Gestión Mesas",

    // Alertas
    alert_local_cerrado_title: "El local está cerrado",
    alert_local_cerrado_message: "No hay ninguna caja abierta. Debes iniciar turno para operar.",

    // Footer
    footer_copyright: "© 2026 Billpro - Todos los derechos reservados",
  },
  en: {
    // General
    welcome: "Welcome",
    settings: "Settings",
    save: "Save",
    cancel: "Cancel",
    language: "Language",
    screen_lock: "Screen Lock",
    screen_lock_desc: "Return to Login after confirming an order (Ideal for shared terminals).",

    // Dashboard General
    dashboard_user: "👤 {{name}}",
    dashboard_role: "{{role}}",
    dashboard_pos_id: "🖥️ POS-01",
    dashboard_current_time: "🕐 {{time}}",
    dashboard_title: "Restaurant Management System",
    dashboard_logo: "BILLPRO",

    // Cash Register Status
    caja_mi_abierta: "🟢 My Register Open",
    caja_abierta_otro: "🔵 Register Open ({{cashierName}})",
    caja_cerrada: "🔴 Register Closed",

    // Cash Register Buttons
    caja_btn_movimiento: "MOVEMENT",
    caja_btn_cerrar_turno: "CLOSE SHIFT",
    caja_btn_abrir_otra: "+ Open Another",
    caja_btn_abrir_ahora: "OPEN REGISTER NOW",

    // Main Menu
    menu_salir: "Exit",
    menu_reimprimir_cuenta: "Reprint Bill",
    menu_reportes_ventas: "Sales Reports",
    menu_gastos_op: "Op. Expenses",
    menu_balance: "Balance",
    menu_gestion_carta: "Menu Management",
    menu_inventario: "Inventory",
    menu_clientes: "Customers",
    menu_parametros: "Settings",
    menu_gestion_usuario: "User Management",
    menu_delivery: "Delivery",
    menu_para_llevar: "Takeaway",
    menu_gestion_mesas: "Table Management",

    // Alerts
    alert_local_cerrado_title: "The establishment is closed",
    alert_local_cerrado_message: "No register is open. You must start a shift to operate.",

    // Footer
    footer_copyright: "© 2026 Billpro - All rights reserved",
  },
  zh: {
    // General
    welcome: "欢迎",
    settings: "设置",
    save: "保存",
    cancel: "取消",
    language: "语言",
    screen_lock: "锁屏",
    screen_lock_desc: "确认订单后返回登录界面（适用于多人共用终端）。",

    // Dashboard General
    dashboard_user: "👤 {{nombre}}",
    dashboard_role: "{{rol}}",
    dashboard_pos_id: "🖥️ POS-01",
    dashboard_current_time: "🕐 {{hora}}",
    dashboard_title: "餐厅管理系统",
    dashboard_logo: "BILLPRO",

    // Cash Register Status
    caja_mi_abierta: "🟢 我的收银台已开启",
    caja_abierta_otro: "🔵 收银台已开启（{{nombreCajero}}）",
    caja_cerrada: "🔴 收银台已关闭",

    // Cash Register Buttons
    caja_btn_movimiento: "资金变动",
    caja_btn_cerrar_turno: "关闭班次",
    caja_btn_abrir_otra: "+ 开启另一个",
    caja_btn_abrir_ahora: "立即开启收银台",

    // Main Menu
    menu_salir: "退出",
    menu_reimprimir_cuenta: "重印账单",
    menu_reportes_ventas: "销售报表",
    menu_gastos_op: "运营支出",
    menu_balance: "收支平衡",
    menu_gestion_carta: "菜单管理",
    menu_inventario: "库存",
    menu_clientes: "客户",
    menu_parametros: "参数设置",
    menu_gestion_usuario: "用户管理",
    menu_delivery: "外卖",
    menu_para_llevar: "外带",
    menu_gestion_mesas: "桌台管理",

    // Alerts
    alert_local_cerrado_title: "门店已关闭",
    alert_local_cerrado_message: "当前无开启的收银台。请开启班次以开始操作。",

    // Footer
    footer_copyright: "© 2026 Billpro - 保留所有权利",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'es');

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  // ✅ Función t() MEJORADA para soportar reemplazo de variables
  // Uso: t('caja_abierta_otro', { nombreCajero: 'Juan' })
  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || key;

    // Si hay parámetros (ej: {{nombre}}), los reemplazamos
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{{${paramKey}}}`, 'g');
        text = text.replace(regex, params[paramKey]);
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
