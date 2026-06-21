import { useState, useEffect } from 'react';
import { Copy, Download, Share2, Heart, Zap, Lock, Crown } from 'lucide-react';
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
  const [plan, setPlan] = useState('free');
  const [scriptsUsed, setScriptsUsed] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const PLAN_LIMITS = {
    free: 5,
    pro: 50,
    business: 999999
  };

  const PLAN_NAMES = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business'
  };

  const PLAN_COLORS = {
    free: 'from-gray-500 to-gray-600',
    pro: 'from-blue-500 to-blue-600',
    business: 'from-purple-500 to-purple-600'
  };

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadUserPlan();
      loadHistory();
      loadScriptsUsed();
    }
  }, [user]);

  const loadUserPlan = async () => {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('plan, scripts_used')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setPlan(data.plan || 'free');
      setScriptsUsed(data.scripts_used || 0);
    } else {
      // Criar subscrição padrão se não existir
      await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        plan: 'free',
        scripts_limit: 5,
        scripts_used: 0
      });
      setPlan('free');
      setScriptsUsed(0);
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from('scripts')
        .select('niche, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

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
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const loadScriptsUsed = async () => {
    const { count } = await supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setScriptsUsed(count || 0);
  };

  const handleGenerate = async () => {
    if (!niche.trim()) {
      setError('Digite um nicho');
      return;
    }

    // Verificar limite
    const limit = PLAN_LIMITS[plan];
    if (scriptsUsed >= limit) {
      setShowUpgradeModal(true);
      setError(`Limite atingido! Você tem ${limit} scripts/mês`);
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
          let inserted = 0;
          for (const script of data.scripts) {
            if (scriptsUsed + inserted >= limit) break;

            const { error: insertError } = await supabase
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

            if (!insertError) {
              inserted++;
            }
          }

          // Atualizar contador
          await supabase
            .from('user_subscriptions')
            .update({ scripts_used: scriptsUsed + inserted })
            .eq('user_id', user.id);

          setScriptsUsed(prev => prev + inserted);
          await loadHistory();

          if (inserted < data.scripts.length) {
            setError(`Limite atingido! ${inserted} de ${data.scripts.length} scripts gerados.`);
          }
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
    if (plan === 'free') {
      setShowUpgradeModal(true);
      setError('Download disponível apenas em planos pagos');
      return;
    }

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

  const scriptLimit = PLAN_LIMITS[plan];
  const scriptPercentage = (scriptsUsed / scriptLimit) * 100;
  const scriptsRemaining = Math.max(0, scriptLimit - scriptsUsed);

  return (
    <div className={`${bg} ${text} min-h-screen transition-colors`}>
      {/* HEADER */}
      <header className={`${card} border-b border-gray-700 sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎬 Reels AI Pro</h1>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${PLAN_COLORS[plan]}`}>
              <p className="text-sm font-bold">
                {plan === 'free' ? '🟢' : plan === 'pro' ? '🔵' : '🟣'} {PLAN_NAMES[plan].toUpperCase()}
              </p>
            </div>
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
        <aside className={`${card} border-r border-gray-700 w-80 p-6 hidden lg:block overflow-y-auto`}>
          {/* PLANO CARD */}
          <div className={`bg-gradient-to-br ${PLAN_COLORS[plan]} rounded-xl p-6 mb-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {plan === 'free' ? '🟢' : plan === 'pro' ? '🔵' : '🟣'} {PLAN_NAMES[plan]}
              </h3>
              {plan !== 'business' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1 bg-white text-gray-900 rounded font-bold text-sm hover:bg-gray-100 transition"
                >
                  Upgrade
                </button>
              )}
            </div>

            {/* USAGE CARD */}
            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Scripts Usados</p>
                <p className="text-sm font-bold">
                  {scriptsUsed} / {scriptLimit === 999999 ? '∞' : scriptLimit}
                </p>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${Math.min(scriptPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-90">
                {scriptsRemaining} scripts restantes
              </p>
            </div>

            {plan === 'free' && (
              <div className="text-xs opacity-90 flex items-center gap-2">
                <Lock size={14} /> Reset mensal: 1º de cada mês
              </div>
            )}
          </div>

          {/* FEATURES */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-400 text-sm uppercase mb-3">Recursos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Gerar scripts
              </div>
              <div className="flex items-center gap-2">
                <span className={plan !== 'free' ? 'text-green-400' : 'text-gray-500'}>
                  {plan !== 'free' ? '✓' : '✗'}
                </span>
                <span className={plan !== 'free' ? '' : 'line-through opacity-50'}>
                  Download PDF
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={plan !== 'free' ? 'text-green-400' : 'text-gray-500'}>
                  {plan !== 'free' ? '✓' : '✗'}
                </span>
                <span className={plan !== 'free' ? '' : 'line-through opacity-50'}>
                  Analytics básico
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={plan === 'business' ? 'text-green-400' : 'text-gray-500'}>
                  {plan === 'business' ? '✓' : '✗'}
                </span>
                <span className={plan === 'business' ? '' : 'line-through opacity-50'}>
                  Agendamento automático
                </span>
              </div>
            </div>
          </div>

          {/* HISTÓRICO */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-400 text-sm uppercase mb-3">Histórico</h4>
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

          {/* FAVORITOS */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-400 text-sm uppercase mb-3">❤️ Favoritos</h4>
            <p className="text-gray-500 text-sm">{favorites.length} script(s) salvo(s)</p>
          </div>

          {/* UPGRADE BOX */}
          {plan !== 'business' && (
            <div
              className={`bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-4 border border-purple-700`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown size={18} className="text-yellow-400" />
                <h4 className="font-bold">Plano Business</h4>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Scripts ilimitados + agendamento automático + API
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold py-2 px-3 rounded-lg hover:opacity-90 transition text-sm"
              >
                Assinar Agora
              </button>
            </div>
          )}
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* SEARCH */}
            <div className={`${card} rounded-xl p-8 mb-8 border border-gray-700 shadow-lg`}>
              <h2 className="text-3xl font-bold mb-2">Scripts Virais com IA</h2>
              <p className="text-gray-400 mb-6">
                Gere scripts profissionais em segundos {scriptsRemaining > 0 && `(${scriptsRemaining} restantes)`}
              </p>

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
                  disabled={appLoading || scriptsRemaining === 0}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap flex items-center gap-2"
                >
                  {scriptsRemaining === 0 && <Lock size={18} />}
                  {appLoading ? '⏳ Gerando...' : '✨ Gerar'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {scriptsRemaining === 0 && (
                <div className="mt-4 p-4 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg flex items-start gap-3">
                  <Zap className="text-yellow-400 flex-shrink-0 mt-1" size={18} />
                  <div>
                    <p className="text-yellow-400 font-bold text-sm">Limite atingido!</p>
                    <p className="text-yellow-300 text-xs mt-1">
                      Você usou todos os {scriptLimit} scripts do seu plano. Upgrade para continuar gerando.
                    </p>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="mt-2 px-3 py-1 bg-yellow-500 text-gray-900 rounded font-bold text-xs hover:bg-yellow-600 transition"
                    >
                      Upgrade Agora
                    </button>
                  </div>
                </div>
              )}
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
                          disabled={plan === 'free'}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                        >
                          {plan === 'free' && <Lock size={16} />}
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

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${card} rounded-2xl p-8 max-w-2xl w-full border border-gray-700`}>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Crown size={28} className="text-yellow-400" /> Escolha seu Plano
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* FREE */}
              <div
                className={`rounded-lg p-6 border-2 transition cursor-pointer ${
                  plan === 'free'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">🟢 Free</h3>
                <p className="text-2xl font-bold mb-4">R$ 0</p>
                <div className="space-y-2 text-sm mb-4">
                  <p>✓ 5 scripts/mês</p>
                  <p>✓ Histórico</p>
                  <p>✗ Download</p>
                </div>
                {plan === 'free' && <p className="text-blue-400 text-sm font-bold">Seu plano atual</p>}
              </div>

              {/* PRO */}
              <div
                className={`rounded-lg p-6 border-2 transition cursor-pointer ${
                  plan === 'pro'
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">🔵 Pro</h3>
                <p className="text-2xl font-bold mb-4">
                  R$ 39<span className="text-sm">/mês</span>
                </p>
                <div className="space-y-2 text-sm mb-4">
                  <p>✓ 50 scripts/mês</p>
                  <p>✓ Download PDF</p>
                  <p>✓ Analytics</p>
                </div>
                {plan === 'pro' && <p className="text-blue-400 text-sm font-bold">Seu plano atual</p>}
                {plan !== 'pro' && (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition text-sm">
                    Upgrade
                  </button>
                )}
              </div>

              {/* BUSINESS */}
              <div
                className={`rounded-lg p-6 border-2 transition cursor-pointer ${
                  plan === 'business'
                    ? 'border-purple-500 bg-purple-500 bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">🟣 Business</h3>
                <p className="text-2xl font-bold mb-4">
                  R$ 149<span className="text-sm">/mês</span>
                </p>
                <div className="space-y-2 text-sm mb-4">
                  <p>✓ Scripts ilimitados</p>
                  <p>✓ Agendamento automático</p>
                  <p>✓ API access</p>
                </div>
                {plan === 'business' && <p className="text-purple-400 text-sm font-bold">Seu plano atual</p>}
                {plan !== 'business' && (
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg transition text-sm">
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}