import { useState, useEffect } from 'react';
import { Copy, Download, Share2, Heart, Trash2, Menu, X, Moon, Sun } from 'lucide-react';

export default function App() {
  const [niche, setNiche] = useState('');
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [copied, setCopied] = useState(null);

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reel_history');
    const savedFav = localStorage.getItem('reel_favorites');
    if (saved) setHistory(JSON.parse(saved));
    if (savedFav) setFavorites(JSON.parse(savedFav));
  }, []);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      setError('Digite um nicho');
      return;
    }

    setLoading(true);
    setError('');
    setScripts([]);

    try {
      const response = await fetch('https://reels-automation-pro.vercel.app/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: { niche } })
      });

      const data = await response.json();

      if (data.success && data.scripts.length > 0) {
        setScripts(data.scripts);
        
        // Salvar no histórico
        const newHistory = [
          { niche, scripts: data.scripts, timestamp: new Date().toLocaleString() },
          ...history
        ].slice(0, 10);
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

  const toggleFavorite = (scriptText) => {
    setFavorites(prev => 
      prev.includes(scriptText) 
        ? prev.filter(f => f !== scriptText)
        : [...prev, scriptText]
    );
    localStorage.setItem('reel_favorites', JSON.stringify(favorites));
  };

  const downloadScript = (script) => {
    const text = `SCRIPT: ${script.titulo}\n\n🎯 GANCHO:\n${script.gancho}\n\n📝 DESENVOLVIMENTO:\n${script.desenvolvimento}\n\n📢 CTA:\n${script.cta}\n\n⏱️ DURAÇÃO: ${script.duracao}\n📈 DIFICULDADE: ${script.dificuldade}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${script.titulo.slice(0, 20)}.txt`;
    a.click();
  };

  const shareScript = (script) => {
    const text = `Confira este script viral gerado por IA:\n\n${script.titulo}\n\n${script.gancho}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const inputBg = darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`${bg} ${textColor} min-h-screen transition-colors duration-300`}>
      {/* HEADER */}
      <header className={`${cardBg} border-b ${borderColor} sticky top-0 z-40`}>
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              🎬 Reels AI
            </h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside className={`${cardBg} border-r ${borderColor} w-64 min-h-screen overflow-y-auto`}>
            <div className="p-6">
              {/* HISTÓRICO */}
              <div>
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">Histórico</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum script gerado ainda</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setNiche(item.niche)}
                        className={`w-full text-left p-3 rounded-lg text-sm transition ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium truncate">{item.niche}</p>
                        <p className="text-xs text-gray-400">{item.timestamp}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* FAVORITOS */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">❤️ Favoritos</h3>
                {favorites.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum favorito salvo</p>
                ) : (
                  <p className="text-sm text-gray-400">{favorites.length} script(s) salvos</p>
                )}
              </div>

              {/* UPGRADE */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gradient-to-br from-blue-900 to-purple-900' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                  <h3 className="font-bold mb-2">Upgrade Pro</h3>
                  <p className="text-sm text-gray-400