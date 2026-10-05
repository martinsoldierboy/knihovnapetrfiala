import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  ArrowUpDown,
  BookMarked,
  Filter,
  Info,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  Library
} from 'lucide-react';
import { sortBooksByLibraryStandard, compareCzechStrings, getAuthorSurname } from '../utils/library';

export default function DatabaseTable({ books, onDeleteBook, onUpdateBook }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('library'); // 'library' | 'author' | 'title' | 'mdt' | 'newest'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Unique categories list for filter dropdown
  const categories = useMemo(() => {
    const set = new Set(books.map(b => b.category).filter(Boolean));
    return Array.from(set);
  }, [books]);

  // Filter & Sort books
  const processedBooks = useMemo(() => {
    let result = [...books];

    // Search filter (Title, Author, ISBN, Signatura)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(book =>
        (book.title && book.title.toLowerCase().includes(q)) ||
        (book.author && book.author.toLowerCase().includes(q)) ||
        (book.isbn && book.isbn.includes(q)) ||
        (book.signatura && book.signatura.toLowerCase().includes(q)) ||
        (book.mdt && book.mdt.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(book => book.category === selectedCategory);
    }

    // Sorting options
    if (sortOption === 'library') {
      result = sortBooksByLibraryStandard(result);
    } else if (sortOption === 'author') {
      result.sort((a, b) => compareCzechStrings(getAuthorSurname(a.author), getAuthorSurname(b.author)));
    } else if (sortOption === 'title') {
      result.sort((a, b) => compareCzechStrings(a.title, b.title));
    } else if (sortOption === 'mdt') {
      result.sort((a, b) => compareCzechStrings(a.mdt || '', b.mdt || ''));
    } else if (sortOption === 'newest') {
      result.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }

    return result;
  }, [books, searchQuery, selectedCategory, sortOption]);

  const handleStartEdit = (book) => {
    setEditingId(book.id);
    setEditFormData({ ...book });
  };

  const handleSaveEdit = (id) => {
    onUpdateBook(id, editFormData);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Export database to CSV
  const exportToCSV = () => {
    const headers = ['Signatura', 'MDT', 'Autor', 'Název', 'ISBN', 'Kategorie', 'Rok vydání', 'Nakladatelství', 'Datum přidání'];
    const rows = processedBooks.map(b => [
      `"${b.signatura || ''}"`,
      `"${b.mdt || ''}"`,
      `"${b.author || ''}"`,
      `"${b.title || ''}"`,
      `"${b.isbn || ''}"`,
      `"${b.category || ''}"`,
      `"${b.publishedYear || ''}"`,
      `"${b.publisher || ''}"`,
      `"${new Date(b.addedAt).toLocaleDateString('cs-CZ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `knihovni_katalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="database-section" className="w-full max-w-6xl mx-auto mt-8 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between p-6 border-b border-slate-800 gap-4 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Knihovní databáze & katalog
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold px-2.5 py-0.5 rounded-full">
                {books.length} {books.length === 1 ? 'kniha' : books.length >= 2 && books.length <= 4 ? 'knihy' : 'knih'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automaticky řazeno podle standardního české knižního systému (MDT → Příjmení autora → Název)
            </p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Exportovat CSV
        </button>
      </div>

      {/* Toolbar: Search, Filter, Sort */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Hledat v katalogu (autor, název, ISBN, signatura)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 text-slate-200 placeholder:text-slate-500 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          {/* Category Filter */}
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950/80 text-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500/60 appearance-none cursor-pointer"
            >
              <option value="all">Všechny kategorie / žánry</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full bg-slate-950/80 text-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500/60 appearance-none cursor-pointer font-medium"
            >
              <option value="library"> Standardní knihovnické řazení (MDT + Autor + Název)</option>
              <option value="author">Abecedně dle příjmení autora (A-Z)</option>
              <option value="title">Abecedně dle názvu knihy (A-Z)</option>
              <option value="mdt">Dle MDT klasifikace</option>
              <option value="newest">Nejnověji naskenované</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Books Table */}
      <div className="overflow-x-auto">
        {processedBooks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookMarked className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">Žádné knihy v tomto zobrazení</p>
            <p className="text-xs text-slate-500 mt-1">Zkus nahrat novou knihu nahoře skenerem nebo změnit vyhledávací filtr.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Signatura</th>
                <th className="py-3.5 px-4">MDT</th>
                <th className="py-3.5 px-4">Autor (Příjmení, Jméno)</th>
                <th className="py-3.5 px-4">Název knihy</th>
                <th className="py-3.5 px-4">ISBN</th>
                <th className="py-3.5 px-4">Kategorie / Žánr</th>
                <th className="py-3.5 px-4">Rok</th>
                <th className="py-3.5 px-4 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {processedBooks.map((book) => {
                const isEditing = editingId === book.id;

                return (
                  <tr key={book.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Signatura */}
                    <td className="py-3.5 px-4 font-mono text-indigo-300 font-semibold whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.signatura || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, signatura: e.target.value })}
                          className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs text-slate-200"
                        />
                      ) : (
                        <span className="bg-indigo-950/60 border border-indigo-800/50 px-2 py-1 rounded-md">
                          {book.signatura || 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* MDT */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-medium whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.mdt || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, mdt: e.target.value })}
                          className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs text-slate-200"
                        />
                      ) : (
                        book.mdt || 'N/A'
                      )}
                    </td>

                    {/* Autor */}
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.author || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                          className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs text-slate-200 w-full"
                        />
                      ) : (
                        book.author
                      )}
                    </td>

                    {/* Název */}
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.title || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                          className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs text-slate-200 w-full"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {book.coverUrl && (
                            <img src={book.coverUrl} alt={book.title} className="w-6 h-8 object-cover rounded shadow-sm flex-shrink-0 max-h-8" />
                          )}
                          <span>{book.title}</span>
                        </div>
                      )}
                    </td>

                    {/* ISBN */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.isbn || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, isbn: e.target.value })}
                          className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs text-slate-200"
                        />
                      ) : (
                        book.isbn
                      )}
                    </td>

                    {/* Kategorie */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                        {book.category || 'Všeobecné'}
                      </span>
                    </td>

                    {/* Rok */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {book.publishedYear || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(book.id)}
                            className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="Uložit změny"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Zrušit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(book)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                            title="Upravit záznam"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBook(book.id)}
                            className="p-1.5 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Smazat knihu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer statistics */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Zobrazeno {processedBooks.length} z celkem {books.length} záznamů v knihovně</span>
        </div>
        <div>
          <span>Systém MDT (Mezinárodní desetinné třídění)</span>
        </div>
      </div>

    </div>
  );
}
