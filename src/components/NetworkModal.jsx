// src/components/NetworkModal.jsx
import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext';

const NetworkModal = () => {
  const { showModal, saveNetworkConfig, networkHost } = useNetwork();
  const [ip, setIp] = useState(networkHost ? networkHost.replace('http://', '') : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!showModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await saveNetworkConfig(ip);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-full m-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Conexión al Servidor</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ingrese la IP del servidor para continuar. <br/>
          <span className="text-xs text-gray-400">Ej: 192.168.1.50:8000</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Host / IP</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.X.X:PORT"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {loading ? 'Verificando...' : 'Conectar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NetworkModal;
