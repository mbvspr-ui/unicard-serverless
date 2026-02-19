export default function Maintenance() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '100%',
        padding: '60px 40px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '80px',
          marginBottom: '20px',
          animation: 'pulse 2s infinite'
        }}>🔧</div>
        <h1 style={{
          color: '#333',
          fontSize: '32px',
          marginBottom: '20px',
          fontWeight: '700'
        }}>Admin Portal Under Maintenance</h1>
        <p style={{
          color: '#666',
          fontSize: '18px',
          lineHeight: '1.6',
          marginBottom: '30px'
        }}>We're currently performing scheduled maintenance to improve your experience. We'll be back online shortly.</p>
        
        <div style={{
          background: '#f8f9fa',
          borderRadius: '10px',
          padding: '20px',
          margin: '30px 0'
        }}>
          <p style={{ margin: '10px 0', fontSize: '16px', color: '#666' }}><strong>🕐 Expected Duration:</strong> 1-2 hours</p>
          <p style={{ margin: '10px 0', fontSize: '16px', color: '#666' }}><strong>📅 Status:</strong> Maintenance in Progress</p>
          <p style={{ margin: '10px 0', fontSize: '16px', color: '#666' }}><strong>✨ What's New:</strong> System improvements and updates</p>
        </div>

        <p style={{
          color: '#666',
          fontSize: '18px',
          lineHeight: '1.6',
          marginBottom: '30px'
        }}>Thank you for your patience and understanding.</p>

        <div style={{
          marginTop: '30px',
          paddingTop: '30px',
          borderTop: '2px solid #eee'
        }}>
          <h3 style={{
            color: '#f5576c',
            fontSize: '20px',
            marginBottom: '15px'
          }}>Need Urgent Assistance?</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center'
          }}>
            <a href="mailto:support@samiulgraphics.com" style={{
              color: '#555',
              fontSize: '16px',
              textDecoration: 'none'
            }}>📧 support@samiulgraphics.com</a>
            <span style={{
              color: '#555',
              fontSize: '16px'
            }}>📞 Contact system administrator</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @media (max-width: 600px) {
          h1 { font-size: 24px !important; }
          p { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
