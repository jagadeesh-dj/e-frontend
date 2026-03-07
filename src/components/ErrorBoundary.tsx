import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fcfcfc', fontFamily: 'system-ui' }}>
                    <h1 style={{ color: '#d93025' }}>Something went wrong.</h1>
                    <p style={{ marginTop: '1rem', color: '#555' }}>An unexpected error occurred in the React application.</p>
                    {this.state.error && (
                        <pre style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f1f3f4', borderRadius: '8px', maxWidth: '800px', overflow: 'auto', textAlign: 'left', fontSize: '13px' }}>
                            {this.state.error.toString()}
                            {'\n'}
                            {this.state.error.stack}
                        </pre>
                    )}
                    <button
                        style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
