import React, { useState, useEffect } from 'react';
import cajaService from '../../services/cajaService';
import { useCaja } from '../../context/CajaContext';
import './AperturaCajaModal.css'; // Crearemos este CSS en el paso 2

const AperturaCajaModal = ({ isOpen, onClose }) => {
    const { notificarApertura } = useCaja();
    
    // Estados del formulario
    const [cajasFisicas, setCajasFisicas] = useState([]);
    const [cajaSeleccionada, setCajaSeleccionada] = useState('');
    const [montoInicial, setMontoInicial] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar las cajas disponibles al abrir el modal
    useEffect(() => {
        if (isOpen) {
            cargarCajas();
        }
    }, [isOpen]);

    const cargarCajas = async () => {
        try {
            const res = await cajaService.getCajasFisicas();
            if (res.success) {
                setCajasFisicas(res.data);
                // Pre-seleccionar la primera si existe
                if (res.data.length > 0) {
                    setCajaSeleccionada(res.data[0].id);
                }
            }
        } catch (err) {
            setError('Error cargando cajas físicas.');
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!cajaSeleccionada || montoInicial === '') {
            setError('Por favor completa todos los campos.');
            setLoading(false);
            return;
        }

        try {
            const datos = {
                caja_id: cajaSeleccionada,
                monto_inicial: parseFloat(montoInicial)
            };

            const res = await cajaService.abrirCaja(datos);

            if (res.success) {
                // Actualizamos el Contexto Global
                notificarApertura(res.data);
                alert(`✅ Caja abierta con $${montoInicial}`);
                onClose(); // Cerramos el modal
            } else {
                setError(res.message);
            }
        } catch (err) {
            console.error(err);
            // Si el backend devuelve error (ej. 400), axios lo lanza como excepción
            const msg = err.response?.data?.message || 'Error al intentar abrir la caja.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content apertura-caja-modal">
                <h2>🔓 Apertura de Caja</h2>
                <p className="subtitle">Inicia la jornada indicando el fondo de caja.</p>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Seleccionar Caja Física:</label>
                        <select 
                            value={cajaSeleccionada} 
                            onChange={(e) => setCajaSeleccionada(e.target.value)}
                            disabled={loading}
                        >
                            {cajasFisicas.map(caja => (
                                <option key={caja.id} value={caja.id}>
                                    {caja.nombre} {caja.estado === 'abierta' ? '(Ocupada)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Monto Inicial (Fondo):</label>
                        <div className="input-with-icon">
                            <span>$</span>
                            <input 
                                type="number" 
                                min="0" 
                                step="100" // Pasos de 100 pesos (ajustable)
                                placeholder="0"
                                value={montoInicial}
                                onChange={(e) => setMontoInicial(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={loading}
                        >
                            {loading ? 'Abriendo...' : 'ABRIR CAJA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AperturaCajaModal;
