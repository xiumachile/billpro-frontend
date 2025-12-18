import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  es: { translation: {
    /* Navegación */
    volver: 'Volver',
    idioma: 'Idioma',
    /* Pestañas */
    impresoras: 'Impresoras',
    comandas: 'Comandas',
    tickets: 'Tickets',
    red: 'Red',
    /* Placeholder */
    seleccionaSeccion: 'Seleccione una sección de parámetros',
    /* Configuración de Impresoras */
    tituloImpresoras: 'Configuración de Impresoras',
    /* Configuración de Comandas */
    tituloComandas: 'Configuración de Comandas',
    /* Configuración de Tickets */
    tituloTickets: 'Configuración de Tickets',
    /* Configuración de Red */
    tituloRed: 'Configuración de Red',
  }},
  en: { translation: {
    volver: 'Back',
    idioma: 'Language',
    impresoras: 'Printers',
    comandas: 'Orders',
    tickets: 'Tickets',
    red: 'Network',
    seleccionaSeccion: 'Select a parameters section',
    tituloImpresoras: 'Printer Settings',
    tituloComandas: 'Order Settings',
    tituloTickets: 'Ticket Settings',
    tituloRed: 'Network Settings',
  }},
  zh: { translation: {
    volver: '返回',
    idioma: '语言',
    impresoras: '打印机',
    comandas: '订单',
    tickets: '小票',
    red: '网络',
    seleccionaSeccion: '选择一个参数部分',
    tituloImpresoras: '打印机设置',
    tituloComandas: '订单设置',
    tituloTickets: '小票设置',
    tituloRed: '网络设置',
  }},
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  });

export default i18n;
