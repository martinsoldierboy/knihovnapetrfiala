import React, { useState } from 'react';
import Scanner from './components/Scanner';
import DatabaseTable from './components/DatabaseTable';
import { loadStoredBooks, saveStoredBooks } from './utils/storage';
import { Camera, Database, Library, Layers } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState(() => loadStoredBooks());
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'database'

  const handleAddBook = (newBook) => {
    setBooks((prev) => {
      // Avoid duplicate entries by ISBN or ID if exists
      const exists = prev.some(b => b.isbn && b.isbn === newBook.isbn && b.isbn !== 'Nezadané ISBN' && b.isbn !== 'Neznámé ISBN');
      if (exists) {
        return prev;
      }
      const updated = [newBook, ...prev];
      saveStoredBooks(updated);
      return updated;
    });
  };

  const handleDeleteBook = (id) => {
    setBooks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveStoredBooks(updated);
      return updated;
    });
  };

  const handleUpdateBook = (id, updatedFields) => {
    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updatedFields } : b));
      saveStoredBooks(updated);
      return updated;
    });
  };

  const handleSwitchToDatabase = () => {
    setActiveTab('database');
    const dbElem = document.getElementById('database-section');
    if (dbElem) {
      dbElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSwitchToScanner = () => {
    setActiveTab('scan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans antialiased pb-24">

      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-900/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Top Modern Header */}
        <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Library className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  Knihovní Skener & Katalog
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  Automatické řazení podle standardů českých knihoven
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                MDT & MDT-Třídění
              </span>
            </div>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">

          {/* Top Camera & Recognition Scanner Viewport */}
          <section className="w-full">
            <Scanner onAddBook={handleAddBook} activeTab={activeTab} />
          </section>

          {/* Database Table Section */}
          <section className="w-full">
            <DatabaseTable
              books={books}
              onDeleteBook={handleDeleteBook}
              onUpdateBook={handleUpdateBook}
            />
          </section>

        </main>
      </div>

      {/* Floating Centered Single-Row Control Bar at bottom of screen */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-full border border-slate-700/80 shadow-2xl shadow-slate-950/80 flex items-center gap-2 ring-1 ring-white/10">

          {/* Skenovat Button */}
          <button
            onClick={handleSwitchToScanner}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Skenovat</span>
          </button>

          {/* Databáze Button */}
          <button
            onClick={handleSwitchToDatabase}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              activeTab === 'database'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Databáze</span>
            <span className="ml-1 bg-slate-950/60 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
              {books.length}
            </span>
          </button>

        </div>
      </div>

    </div>
  );
}
