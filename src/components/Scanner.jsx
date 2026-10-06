import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Tesseract from 'tesseract.js';
import { Camera, Search, BookOpen, AlertCircle, CheckCircle, RefreshCw, Upload, Sparkles } from 'lucide-react';
import { fetchBookMetadata, formatAuthorName, inferMDTCode, generateSignatura } from '../utils/library';

export default function Scanner({ onAddBook, activeTab }) {
  const [scanMethod, setScanMethod] = useState('camera'); // 'camera' | 'ocr' | 'manual'
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }
  const [manualQuery, setManualQuery] = useState('');

  // Manual form detailed fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualIsbn, setManualIsbn] = useState('');

  // OCR state
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  const processISBNRef = useRef(null);

  const handleProcessISBN = async (isbn) => {
    setLoading(true);
    setStatusMessage({ type: 'info', text: `Vyhledávám knihu podle ISBN: ${isbn}...` });

    try {
      const book = await fetchBookMetadata(isbn);
      if (book) {
        onAddBook(book);
        setStatusMessage({
          type: 'success',
          text: `Kniha "${book.title}" byla úspěšně naskenována a zařazena do databáze!`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Pro ISBN ${isbn} nebyla v online databázích nalezena kniha. Zadejte údaje ručně.`
        });
        setScanMethod('manual');
        setManualIsbn(isbn);
      }
    } catch (error) {
      console.error("Chyba při vyhledávání ISBN:", error);
      setStatusMessage({
        type: 'error',
        text: 'Došlo k chybě při načítání dat o knize. Zkuste to znovu.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    processISBNRef.current = handleProcessISBN;
  });

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (scanMethod === 'camera' && activeTab === 'scan') {
      const container = document.getElementById('reader');
      if (container) {
        try {
          html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            {
              fps: 10,
              qrbox: { width: 280, height: 180 },
              aspectRatio: 1.777778,
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              }
            },
            /* verbose= */ false
          );

          const onScanSuccess = async (decodedText, decodedResult) => {
            console.log(`Kód naskenován = ${decodedText}`, decodedResult);
            if (html5QrcodeScanner) {
              html5QrcodeScanner.clear().catch(e => console.error(e));
            }
            if (processISBNRef.current) {
              processISBNRef.current(decodedText);
            }
          };

          const onScanFailure = () => {
            // Continuous scanning, silence log noise
          };

          html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        } catch (err) {
          console.warn("Kamera není k dispozici nebo je blokována:", err);
          setTimeout(() => {
            setStatusMessage({
              type: 'info',
              text: 'Kamera nebyla rozpoznána nebo je blokována. Můžete použít vyhledávání nebo nahrání obrázku.'
            });
          }, 0);
        }
      }
    }

    return () => {
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.clear().catch(err => console.error(err));
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [scanMethod, activeTab]);

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    setLoading(true);
    setStatusMessage({ type: 'info', text: `Vyhledávám "${manualQuery}"...` });

    try {
      const book = await fetchBookMetadata(manualQuery);
      if (book) {
        onAddBook(book);
        setStatusMessage({
          type: 'success',
          text: `Kniha "${book.title}" byla zařazena do databáze!`
        });
        setManualQuery('');
      } else {
        setStatusMessage({
          type: 'error',
          text: `Pro výraz "${manualQuery}" nebyly nalezeny žádné výsledky. Vyplňte formulář níže.`
        });
      }
    } catch (error) {
      console.error("Chyba při ručním vyhledávání:", error);
      setStatusMessage({ type: 'error', text: 'Chyba při hledání v databázi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddSubmit = (e) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'Zadejte prosím název knihy.' });
      return;
    }

    const formattedAuthor = formatAuthorName(manualAuthor);
    const mdt = inferMDTCode([], '', manualTitle);
    const signatura = generateSignatura(mdt.code, formattedAuthor, manualTitle);

    const newBook = {
      id: Date.now().toString(),
      title: manualTitle.trim(),
      author: formattedAuthor,
      rawAuthor: manualAuthor.trim() || 'Neznámý autor',
      isbn: manualIsbn.trim() || 'Nezadané ISBN',
      publisher: 'Vlastní záznam',
      publishedYear: new Date().getFullYear().toString(),
      category: mdt.category,
      mdt: mdt.code,
      signatura: signatura,
      coverUrl: null,
      description: 'Ručně přidaný záznam knihy.',
      addedAt: new Date().toISOString()
    };

    onAddBook(newBook);
    setStatusMessage({
      type: 'success',
      text: `Kniha "${newBook.title}" byla přidána do knihovny!`
    });

    setManualTitle('');
    setManualAuthor('');
    setManualIsbn('');
  };

  const handleOCRImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrProcessing(true);
    setOcrProgress(0);
    setStatusMessage({ type: 'info', text: 'Aktivuji rozeznávání textu (OCR) na obálce / zadní straně...' });

    try {
      const result = await Tesseract.recognize(
        file,
        'ces+eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      console.log('Rozpoznaný text:', text);

      // Check for ISBN pattern in text
      const isbnMatch = text.match(/(?:ISBN(?:-13)?:?\s*)?(97[89][-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?[\dX])/i);

      if (isbnMatch) {
        const foundIsbn = isbnMatch[1].replace(/[-\s]/g, '');
        setStatusMessage({ type: 'info', text: `Nalezeno ISBN v textu: ${foundIsbn}. Hledám podrobnosti...` });
        await handleProcessISBN(foundIsbn);
      } else {
        // Fallback extract first couple lines as title/author candidate
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
        if (lines.length > 0) {
          const candidateQuery = lines.slice(0, 2).join(' ');
          setStatusMessage({ type: 'info', text: `Pokouším se vyhledat podle rozpoznaného textu: "${candidateQuery}"` });
          const book = await fetchBookMetadata(candidateQuery);
          if (book) {
            onAddBook(book);
            setStatusMessage({ type: 'success', text: `Nalezena kniha: "${book.title}"!` });
          } else {
            setScanMethod('manual');
            setManualTitle(lines[0] || '');
            setManualAuthor(lines[1] || '');
            setStatusMessage({
              type: 'info',
              text: 'Byl rozpoznán text obálky. Doplňte detaily ve formuláři níže.'
            });
          }
        } else {
          setStatusMessage({ type: 'error', text: 'Nepodařilo se rozpoznat čitelný text. Zkuste jiný snímek.' });
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Chyba při zpracování obrázku.' });
    } finally {
      setOcrProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">

      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-950/40 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">Skener a rozpoznávání knih</h2>
            <p className="text-xs text-slate-400">Naskenujte čárový kód ISBN, obálku, nebo vyhledejte knihu</p>
          </div>
        </div>

        {/* Scan Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-medium text-slate-400">
          <button
            onClick={() => setScanMethod('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              scanMethod === 'camera'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Kamera (ISBN)
          </button>
          <button
            onClick={() => setScanMethod('ocr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              scanMethod === 'ocr'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Zadní strana (OCR)
          </button>
          <button
            onClick={() => setScanMethod('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              scanMethod === 'manual'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Vyhledat / Ručně
          </button>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="p-6">

        {/* Mode 1: Camera ISBN Scanner */}
        {scanMethod === 'camera' && (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-full max-w-md bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden shadow-inner p-2">
              <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
            </div>
            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              Naměřte kameru na čárový kód (ISBN) na zadní straně knihy
            </p>
          </div>
        )}

        {/* Mode 2: OCR Image Reader */}
        {scanMethod === 'ocr' && (
          <div className="flex flex-col items-center justify-center min-h-[280px] p-6 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-950/30 transition-all">
            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">Nahrajte foto zadní strany / obálky knihy</h3>
            <p className="text-xs text-slate-400 mb-4 text-center max-w-md">
              Inteligentní textové rozpoznávání (OCR) automaticky přečte ISBN, autor, název nebo text na obálce a dohledá podrobnosti.
            </p>

            <label className="relative cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Vybrat fotku obálky
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOCRImageUpload}
                disabled={ocrProcessing}
                className="hidden"
              />
            </label>

            {ocrProcessing && (
              <div className="w-full max-w-xs mt-4 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${ocrProgress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-400 font-mono">Rozpoznávám text... {ocrProgress}%</span>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Quick Search & Manual Form */}
        {scanMethod === 'manual' && (
          <div className="space-y-6">
            {/* Quick Online Search */}
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Zadejte název knihy, jméno autora nebo ISBN..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full bg-slate-950/70 text-slate-200 placeholder:text-slate-500 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !manualQuery.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Vyhledat
              </button>
            </form>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-xs text-slate-500 font-medium uppercase tracking-wider absolute">nebo přidejte ručně</span>
            </div>

            {/* Manual Entry Form */}
            <form onSubmit={handleManualAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Název knihy *</label>
                <input
                  type="text"
                  required
                  placeholder="např. Krakatit"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-slate-950/70 text-slate-200 placeholder:text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-indigo-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Autor (Jméno Příjmení)</label>
                <input
                  type="text"
                  placeholder="např. Karel Čapek"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  className="w-full bg-slate-950/70 text-slate-200 placeholder:text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-indigo-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">ISBN</label>
                <input
                  type="text"
                  placeholder="např. 9788073352349"
                  value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)}
                  className="w-full bg-slate-950/70 text-slate-200 placeholder:text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-indigo-500/60 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all border border-slate-700/60 flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Zařadit do katalogu
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feedback Alert Status Messages */}
        {statusMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-200 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
