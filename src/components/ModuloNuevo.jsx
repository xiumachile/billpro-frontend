// src/components/ModuloNuevo.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ModuloNuevo({ usuario }) {
  const navigate = useNavigate();

  // Función para verificar roles (reutilizable)
  const tieneRol = (nombreRol) => {
    return usuario?.roles?.some(rol => 
      (rol.nombre || rol.name || '').toLowerCase().trim() === nombreRol.toLowerCase().trim()
    );
  };

  // Ejemplo: solo dueño y admin pueden acceder
  useEffect(() => {
    if (!tieneRol('dueño') && !tieneRol('admin') && !tieneRol('administrador')) {
      alert('No tienes permiso para acceder a este módulo');
      navigate('/');
    }
  }, [usuario, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      padding: '10px',
    }}>
      {/* Barra superior */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        marginBottom: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2>Nombre del Módulo</h2>
        <button 
          onClick={() => navigate('/')}
          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          ← Volver
        </button>
      </div>

      {/* Contenido principal */}
      <div style={{ flexGrow: 1, padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Bienvenido al nuevo módulo</h3>
        {/* Contenido aquí */}
      </div>

      {/* Pie de página */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '12px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#999',
        borderTop: '1px solid #e0e0e0',
        borderRadius: '8px',
        marginTop: '10px',
      }}>
        © 2026 Billpro - Todos los derechos reservados
      </div>
    </div>
  );
}
