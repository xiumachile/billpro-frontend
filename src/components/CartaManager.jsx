// src/components/CartaManager.jsx
import React from 'react';
import MenuManager from './menu/MenuManager';

export default function CartaManager({ usuario }) {
  return (
    <div style={{ padding: '20px', height: '100vh', overflow: 'auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
        📖 Gestión de Carta
      </h1>
      <MenuManager usuario={usuario} />
    </div>
  );
}
