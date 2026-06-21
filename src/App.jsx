import { useState, useEffect } from 'react';
import { Copy, Download, Share2, Heart } from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './Auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [niche, setNiche] = useState('');
  const [scripts, setScripts] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error: err } = await supabase
        .from('scripts')
        .select('niche, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (err) {
        console.error('Erro ao carregar histórico:', err);
        return;
      }

      if (data && data.length > 0) {
        const seen = new Set();
        const unique = data
          .filter(item => {
            if (seen.has(item.niche)) return false;
            seen.add(item.niche);
            return true;
          })
          .map(h => ({
            niche: h.niche,
            timestamp: new Date(h.created_at).toLocaleString()
          }));
        setHistory(unique);
      }
    } catch (err) {
      console.error('Erro geral ao carregar histórico:', err);
    }
  };

  const handleGenerate = async () => {
    if (!niche.trim()) {
      setError('Digite um nicho');
      return;
    }

    setAppLoading(true);
    setError('');

    try {
      const response = await fetch('https://reels-automation-pro.vercel.app/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: { niche } })
      });

      const data = await response.json();

      if (data.success && data.scripts && data.scripts.length > 0) {
        setScripts(data.scripts);

        if (user) {
          console.log('User ID:', user.id);
          console.log('Salvando', data.scripts.length, 'scripts');

          for (const script of data.scripts) {
            const { data: insertedData, error: insertError } = await supabase
              .from('scripts')
              .insert([
                {
                  user_id: user.id,
                  niche: niche,
                  titulo: script.titulo,
                  gancho: script.gancho,
                  desenvolvimento: script.desenvolvimento,
                  cta: script.cta,
                  duracao: script.duracao,
                  dificuldade: script.dificuldade,
                  is_favorite: false
                }
              ]);

            if (insertError) {
              console.error('Erro ao inserir script:', insertError);
            } else {
              console.log('Script inserido com sucesso');
            }
          }

          console.log('Recarregando histórico...');
          await loadHistory();
        }
      } else {
        setError('Nenhum script gerado');
      }
    } catch (err) {
      console.error('Erro geral:', err);
      setError('Erro: ' + err.message);
    } finally {
      setAppLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadScript = (script) => {
    const text = `SCRIPT: ${script.titulo}\n\nGANCHO:\n${script.gancho}\n\nDESENVOLVIMENTO:\n${script.desenvolvimento}\n\nCTA:\n${script.cta}\n\nDURAÇÃO: ${script.duracao}\nDIFICULDADE: ${script.dificuldade}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${script.titulo.slice(0, 20)}.txt`;
    a.click();
  };

  const shareScript = (script) => {
    const text = `${script.titulo}\n\n${script.gancho}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleFavorite = async (scriptTitle) => {
    if (!user) return;
    const isFav = favorites.includes(scriptTitle);
    
    await supabase
      .from('scripts')
      .update({ is_favorite: !isFav })
      .eq('titulo', scriptTitle)
      .eq('user_id', user.id);

    setFavorites(prev =>
      prev.includes(scriptTitle)
        ? prev.filter(f => f !== scriptTitle)
        : [...prev, scriptTitle]
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScripts([]);
    setHistory([]);
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const card = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const input = darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-gray-300';

  if (loading) {
    return (
      <div className={`${bg} ${text} min-h-screen flex items-center justify-center`}>
        <p className="text-xl">⏳ Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setUser(true)} />;
  }

  return (
    <div className={`${bg} ${text} min-h-screen transition-colors`}>
      {/* HEADER */}
      <header className={`${card} border-b border-gray-700 sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎬 Reels AI Pro</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className={`${card} border-r border-gray-700 w-64 p-6 hidden lg:block overflow-y-auto`}>
          <div>
            <h3 className="font-bold text-gray-400 text-sm uppercase mb-4">📋 Histórico</h3>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma busca ainda</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setNiche(h.niche)}
                    className={`w-full text-left p-2 rounded transition ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{h.niche}</p>
                    <p className="text-xs text-gray-500">{h.timestamp}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="font-bold text-gray-400 text-sm uppercase mb-4">❤️ Favoritos</h3>
            <p className="text-gray-500 text-sm">{favorites.length} script(s) salvo(s)</p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className={`p-4 rounded-lg ${
              darkMode
                ? 'bg-gradient-to-br from-blue-900 to-purple-900'
                : 'bg-gradient-to-br from-blue-100 to-purple-100'
            }`}>
              <h4 className="font-bold mb-2">⭐ Pro</h4>
              <p className="text-xs text-gray-300 mb-3">Ilimitado + Download + Templates</p>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 px-3 rounded text-sm hover:opacity-90 transition">
                Assinar
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* SEARCH */}
            <div className={`${card} rounded-xl p-8 mb-8 border border-gray-700 shadow-lg`}>
              <h2 className="text-3xl font-bold mb-2">Scripts Virais com IA</h2>
              <p className="text-gray-400 mb-6">Gere 5 scripts prontos para gravar em segundos</p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ex: Marketing Digital, Personal Trainer, Beleza..."
                  className={`flex-1 px-4 py-3 rounded-lg border ${input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                  onClick={handleGenerate}
                  disabled={appLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {appLoading ? '⏳ Gerando...' : '✨ Gerar'}
                </button>
              </div>

              {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
            </div>

            {/* SCRIPTS */}
            {scripts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">📝 {scripts.length} Scripts Gerados</h2>
                <div className="space-y-6">
                  {scripts.map((s, i) => (
                    <div
                      key={i}
                      className={`${card} rounded-xl p-6 border-l-4 border-blue-500 border border-gray-700 shadow-lg hover:shadow-xl transition`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{s.titulo}</h3>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-xs font-semibold">
                              ⏱️ {s.duracao}
                            </span>
                            <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded-full text-xs font-semibold">
                              📈 {s.dificuldade}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFavorite(s.titulo)}
                          className="transition hover:scale-110"
                        >
                          <Heart
                            size={24}
                            fill={favorites.includes(s.titulo) ? 'currentColor' : 'none'}
                            className={
                              favorites.includes(s.titulo)
                                ? 'text-red-500'
                                : 'text-gray-500 hover:text-red-500'
                            }
                          />
                        </button>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">🎯 Gancho (0-3s)</p>
                          <p className="text-base leading-relaxed mb-2">{s.gancho}</p>
                          <button
                            onClick={() => copyToClipboard(s.gancho, `gancho-${i}`)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Copy size={14} />{' '}
                            {copied === `gancho-${i}` ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">📝 Desenvolvimento</p>
                          <p className="text-base leading-relaxed mb-2">{s.desenvolvimento}</p>
                          <button
                            onClick={() => copyToClipboard(s.desenvolvimento, `dev-${i}`)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Copy size={14} /> {copied === `dev-${i}` ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">📢 Call-to-Action</p>
                          <p className="text-base font-semibold text-blue-400 mb-2">{s.cta}</p>
                          <button
                            onClick={() => copyToClipboard(s.cta, `cta-${i}`)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Copy size={14} /> {copied === `cta-${i}` ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => downloadScript(s)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition text-sm font-medium"
                        >
                          <Download size={18} /> Baixar
                        </button>
                        <button
                          onClick={() => shareScript(s)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition text-sm font-medium"
                        >
                          <Share2 size={18} /> WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!scripts.length && !appLoading && (
              <div className={`${card} rounded-xl p-12 text-center border border-gray-700`}>
                <p className="text-gray-400 text-lg">📝 Digite um nicho para começar a gerar scripts virais</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}