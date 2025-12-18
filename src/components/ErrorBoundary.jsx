import React from 'react';
import {
  AlertCircle,
  Home,
  RotateCcw,
  Send,
} from 'lucide-react';

// 🔐 Ajusta la URL según tu backend
const LOGS_API_URL = '/api/logs/error';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });

    // ✅ Enviar error al backend (solo en producción, opcionalmente también en desarrollo)
    this.reportErrorToServer(error, errorInfo);
  }

  // ✅ Método para enviar el error a tu API
  reportErrorToServer = async (error, errorInfo) => {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        componentStack: errorInfo?.componentStack || '',
        error: {
          name: error.name || 'UnknownError',
          message: error.message || String(error),
          stack: error.stack || '',
        },
        user: this.props.usuario?.id || null, // opcional: si pasas usuario
        environment: process.env.NODE_ENV,
      };

      // ✅ POST al endpoint de logs
      const response = await fetch(LOGS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluye token si tu API lo requiere:
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('⚠️ Error al enviar log al servidor:', response.status);
      } else {
        console.log('✅ Error reportado al servidor');
      }
    } catch (networkError) {
      console.error('📡 Error al conectar con el servicio de logs:', networkError);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7f1 100%)',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(220, 53, 69, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertCircle size={40} color="#dc3545" />
            </div>

            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#343a40',
              marginBottom: '12px'
            }}>
              Algo salió mal 😕
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#6c757d',
              marginBottom: '24px',
              lineHeight: 1.5
            }}>
              Hemos registrado el error y nuestro equipo lo revisará pronto.
              Mientras tanto, puedes reintentar o volver al inicio.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'left',
                fontSize: '13px',
                color: '#495057',
                marginBottom: '24px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <strong style={{ color: '#dc3545' }}>Detalles (solo en desarrollo):</strong>
                <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <RotateCcw size={16} />
                Reintentar
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <Home size={16} />
                Ir al inicio
              </button>
            </div>

            <p style={{
              fontSize: '12px',
              color: '#adb5bd',
              marginTop: '24px',
            }}>
              <Send size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Informe de error enviado automáticamente.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
