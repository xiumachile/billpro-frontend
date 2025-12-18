// src/components/PermissionRoute.jsx
import { Navigate } from 'react-router-dom';

const PermissionRoute = ({ children, requiredPermission }) => {
  const usuario = JSON.parse(localStorage.getItem('usuarioInfo'));
  
  if (!usuario) {
    console.warn('[PermissionRoute] Usuario no autenticado');
    return <Navigate to="/login" replace />;
  }

  // Normalizar permisos: convertir guiones medios a bajos
  const normalizarPermiso = (permiso) => permiso.replace(/-/g, '_');
  
  const permisoRequerido = normalizarPermiso(requiredPermission);
  
  const tienePermiso = Array.isArray(usuario.permissions) && 
    usuario.permissions.some(p => normalizarPermiso(p) === permisoRequerido);
  
  if (!tienePermiso) {
    console.warn(`[PermissionRoute] Permiso denegado: ${requiredPermission}`);
    console.warn(`[PermissionRoute] Buscando: ${permisoRequerido}`);
    console.warn(`[PermissionRoute] Permisos disponibles:`, usuario.permissions);
    alert('No tienes permiso para acceder a esta sección.');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PermissionRoute;
