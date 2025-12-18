import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cajaService from '../../services/cajaService';

const ConfiguracionCajas = () => {
    const navigate = useNavigate();
    const [cajas, setCajas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nombreNueva, setNombreNueva] = useState('');
    const [editandoId, setEditandoId] = useState(null);
    const [nombreEdit, setNombreEdit] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarCajas();
    }, []);

    const cargarCajas = async () => {
        try {
            setLoading(true);
            const res = await cajaService.getCajasFisicas();
            if (res.success) setCajas(res.data);
        } catch (err) {
            setError('Error cargando cajas.');
        } finally {
            setLoading(false);
        }
    };

    const handleCrear = async (e) => {
        e.preventDefault();
        if (!nombreNueva.trim()) return;

        try {
            await cajaService.crearCaja(nombreNueva);
            setNombreNueva('');
            cargarCajas();
            alert('Caja creada exitosamente');
        } catch (err) {
            alert('Error al crear caja: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar/desactivar esta caja?')) return;
        try {
            const res = await cajaService.eliminarCaja(id);
            alert(res.message);
            cargarCajas();
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    const iniciarEdicion = (caja) => {
        setEditandoId(caja.id);
        setNombreEdit(caja.nombre);
    };

    const guardarEdicion = async (id) => {
        try {
            await cajaService.actualizarCaja(id, nombreEdit);
            setEditandoId(null);
            cargarCajas();
        } catch (err) {
            alert('Error al actualizar');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#2c3e50' }}>🖥️ Configuración de Cajas Físicas</h1>
                <button onClick={() => navigate('/parametros')} style={styles.btnVolver}>
                    ⬅ Volver
                </button>
            </div>

            {/* Formulario de Creación */}
            <form onSubmit={handleCrear} style={styles.card}>
                <h3>Agregar Nueva Caja</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="Ej: Caja Terraza"
                        value={nombreNueva}
                        onChange={(e) => setNombreNueva(e.target.value)}
                        style={styles.input}
                    />
                    <button type="submit" style={styles.btnPrimary}>Agregar</button>
                </div>
            </form>

            {/* Listado */}
            <div style={styles.card}>
                <h3>Listado de Cajas</h3>
                {loading ? <p>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>ID</th>
                                <th style={{ padding: '10px' }}>Nombre</th>
                                <th style={{ padding: '10px' }}>Estado Actual</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cajas.map(caja => (
                                <tr key={caja.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>#{caja.id}</td>
                                    <td style={{ padding: '10px' }}>
                                        {editandoId === caja.id ? (
                                            <input 
                                                value={nombreEdit} 
                                                onChange={(e) => setNombreEdit(e.target.value)}
                                                style={styles.inputSmall}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 'bold' }}>{caja.nombre}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px',
                                            background: caja.estado === 'abierta' ? '#d4edda' : '#f8d7da',
                                            color: caja.estado === 'abierta' ? '#155724' : '#721c24',
                                            fontSize: '0.85rem'
                                        }}>
                                            {caja.estado.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        {editandoId === caja.id ? (
                                            <>
                                                <button onClick={() => guardarEdicion(caja.id)} style={styles.btnSave}>💾</button>
                                                <button onClick={() => setEditandoId(null)} style={styles.btnCancel}>❌</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => iniciarEdicion(caja)} style={styles.btnEdit}>✏️</button>
                                                <button onClick={() => handleEliminar(caja.id)} style={styles.btnDelete}>🗑️</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const styles = {
    card: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '20px' },
    input: { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' },
    inputSmall: { padding: '5px', borderRadius: '4px', border: '1px solid #ddd' },
    btnPrimary: { background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    btnVolver: { background: '#95a5a6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
    btnEdit: { background: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' },
    btnDelete: { background: '#e74c3c', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
    btnSave: { background: '#2ecc71', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' },
    btnCancel: { background: '#95a5a6', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
};

export default ConfiguracionCajas;
