import { useState, useEffect } from 'react';
import { Copy, Download, Share2, Heart } from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './Auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [niche, setNiche] = useState('');
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('reel_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      setError('Digite um nicho');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://reels-automation-pro.vercel.app/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: { niche } })
      });

      const data = await response.json();

      if (data.success && data.scripts.length > 0) {
        setScripts(data.scripts);
        const newHistory = [
          { niche, timestamp: new Date().toLocaleString() },
          ...history
        ].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('reel_history', JSON.stringify(newHistory));
      } else {
        setError('Nenhum script gerado');
      }
    } catch (err) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadScript = (script) => {
    const text = `SCRIPT: ${script.titulo}\n\nGANCHO:\n${script.gancho}\n\nDESENVOLVIMENTO:\n${script.desenvolvimento}\n\nCTA:\n${script.cta}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script.txt`;
    a.click();
  };

  const shareScript = (script) => {
    const text = `${script.titulo}\n\n${script.gancho}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const card = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const input = darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-gray-300';

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setUser(true)} />;
  }

  return (
    <div className={`${bg} ${text} min-h-screen transition-colors`}>
      <header className={`${card} border-b border-gray-700 sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎬 Reels AI Pro</h1>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-gray-700">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="flex min-h-screen">
        <aside className={`${card} border-r border-gray-700 w-64 p-6 hidden lg:block`}>
          <h3 className="font-bold text-gray-400 text-sm mb-4">📋 HISTÓRICO</h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma busca ainda</p>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <button key={i} onClick={() => setNiche(h.niche)} className="w-full text-left p-2 rounded hover:bg-gray-700 text-sm">
                  <p className="font-medium">{h.niche}</p>
                  <p className="text-xs text-gray-500">{h.timestamp}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="font-bold text-gray-400 text-sm mb-4">❤️ FAVORITOS</h3>
            <p className="text-gray-500 text-sm">{favorites.length} script(s) salvos</p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700 bg-gradient-to-br from-blue-900 to-purple-900 p-4 rounded-lg">
            <h4 className="font-bold mb-2">⭐ Pro</h4>
            <p className="text-xs text-gray-300 mb-3">Ilimitado + Download</p>
            <button className="w-full bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-blue-700">
              Assinar
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className={`${card} rounded-xl p-8 mb-8 border border-gray-700`}>
              <h2 className="text-3xl font-bold mb-2">Scripts Virais com IA</h2>
              <p className="text-gray-400 mb-6">Gere 5 scripts prontos para gravar em segundos</p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ex: Marketing, Personal Trainer, Beleza..."
                  className={`flex-1 px-4 py-3 rounded-lg border ${input}`}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? '⏳' : '✨'} {loading ? 'Gerando...' : 'Gerar'}
                </button>
              </div>

              {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
            </div>

            {scripts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">📝 {scripts.length} Scripts</h2>
                <div className="space-y-6">
                  {scripts.map((s, i) => (
                    <div key={i} className={`${card} rounded-xl p-6 border-l-4 border-blue-500 border border-gray-700`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{s.titulo}</h3>
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-xs">⏱️ {s.duracao}</span>
                            <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded-full text-xs">📈 {s.dificuldade}</span>
                          </div>
                        </div>
                        <button onClick={() => {
                          setFavorites(prev => prev.includes(s.titulo) ? prev.filter(f => f !== s.titulo) : [...prev, s.titulo]);
                        }} className="transition">
                          <Heart size={24} fill={favorites.includes(s.titulo) ? 'currentColor' : 'none'} className={favorites.includes(s.titulo) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} />
                        </button>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-1">🎯 GANCHO</p>
                          <p className="mb-2">{s.gancho}</p>
                          <button onClick={() => copyToClipboard(s.gancho, `g${i}`)} className="text-xs text-blue-400 hover:text-blue-300">
                            {copied === `g${i}` ? '✓ Copiado' : 'Copiar'}
                          </button>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-1">📝 DESENVOLVIMENTO</p>
                          <p className="mb-2">{s.desenvolvimento}</p>
                          <button onClick={() => copyToClipboard(s.desenvolvimento, `d${i}`)} className="text-xs text-blue-400 hover:text-blue-300">
                            {copied === `d${i}` ? '✓ Copiado' : 'Copiar'}
                          </button>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-1">📢 CTA</p>
                          <p className="text-blue-400 font-semibold mb-2">{s.cta}</p>
                          <button onClick={() => copyToClipboard(s.cta, `c${i}`)} className="text-xs text-blue-400 hover:text-blue-300">
                            {copied === `c${i}` ? '✓ Copiado' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-700">
                        <button onClick={() => downloadScript(s)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center justify-center gap-2">
                          <Download size={16} /> Baixar
                        </button>
                        <button onClick={() => shareScript(s)} className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm flex items-center justify-center gap-2">
                          <Share2 size={16} /> WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!scripts.length && !loading && (
              <div className={`${card} rounded-xl p-12 text-center border border-gray-700`}>
                <p className="text-gray-400">Digite um nicho para começar 🎬</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}