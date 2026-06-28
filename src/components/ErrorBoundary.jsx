import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    const RELOAD_KEY = 'app_crash_reloads';
    let reloads = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10);

    if (reloads < 2) {
      // If we haven't reached the limit, reload the page invisibly
      this.setState({ reloading: true });
      sessionStorage.setItem(RELOAD_KEY, (reloads + 1).toString());
      window.location.reload();
    } else {
      // Limit reached, reset counter so manual refreshes work fresh
      sessionStorage.removeItem(RELOAD_KEY);
    }
  }

  componentDidMount() {
    // If the component successfully mounts and survives for 5 seconds without crashing, reset the crash counter.
    this.resetTimeout = setTimeout(() => {
      sessionStorage.removeItem('app_crash_reloads');
    }, 5000);
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  render() {
    if (this.state.reloading) {
      // Render nothing or a minimal spinner while triggering the automatic reload
      return <div style={{ height: '100vh', background: '#0D0D0B' }} />;
    }

    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D0D0B', color: '#F5F0E8', fontFamily: "'DM Sans', sans-serif" }}>
          <h1 style={{ fontSize: '2.5rem', fontFamily: "'Cormorant Garamond', serif", color: '#C9A96E', marginBottom: 16 }}>Something went wrong.</h1>
          <p style={{ color: '#A89880', marginBottom: 24, textAlign: 'center', maxWidth: 400, lineHeight: 1.5 }}>
            We're sorry, but an unexpected error occurred. Please try refreshing the page.
          </p>
          <button 
            onClick={() => {
              sessionStorage.removeItem('app_crash_reloads');
              window.location.reload();
            }} 
            style={{ padding: '12px 32px', background: '#C9A96E', color: '#111111', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
