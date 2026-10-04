import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/80 mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold mb-2">Při načítání aplikace došlo k chybě</h1>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            Omlouváme se. Došlo k neočekávané chybě při vykreslování stránky: <br />
            <span className="font-mono text-rose-300 mt-2 inline-block bg-slate-900 px-3 py-1 rounded border border-slate-800">
              {this.state.error?.toString() || 'Neznámá chyba'}
            </span>
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Obnovit stránku
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
