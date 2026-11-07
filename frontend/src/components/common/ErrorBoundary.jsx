import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0E1310',
          color: '#F8F9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'monospace'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#171E19',
            border: '2px solid #FFE17C',
            padding: '32px',
            boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#FFE17C',
                color: '#171E19',
                fontWeight: 'bold',
                padding: '4px 8px',
                fontSize: '12px'
              }}>
                ROADGUARD DIAGNOSTIC
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>SYSTEM RECOVERY SCREEN</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#B7C6C2', lineHeight: '1.6' }}>
              A client-side initialization anomaly was detected and safely intercepted. You can clear corrupted local cache and reload the application below.
            </p>
            {this.state.error && (
              <pre style={{
                backgroundColor: '#101512',
                border: '1px solid #2D3931',
                padding: '12px',
                fontSize: '11px',
                color: '#FFE17C',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                margin: '16px 0'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#FFE17C',
                color: '#171E19',
                border: '2px solid #171E19',
                padding: '10px 20px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '3px 3px 0px #000'
              }}
            >
              RESET LOCAL CACHE & RELOAD
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

