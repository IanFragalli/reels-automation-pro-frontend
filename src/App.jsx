import { useState, useEffect } from 'react';
import { Copy, Download, Share2, Heart, Zap, Lock, Crown, BarChart3, FileText, Settings, LogOut, Mail, Key, Trash2, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import Pricing from './Pricing';
import Admin from './Admin';

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
  const [currentPage, setCurrentPage] = useState('scripts');
  const [userProfile, setUserProfile] = useState({
    email: '',
    user_metadata: { full_name: '' }
  });
  const [settingsForm, setSettingsForm] = useState({
    fullName: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    totalScripts: 0,
    totalNiches: 0,
    favoriteCount: 0,
    nicheData: [],
    timelineData: [],
    topNiche: ''
  });

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

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

  // Admin check - simples verificação de email
  const isAdmin = user?.email === 'ianfragalli@hotmail.com';

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setUserProfile(session.user);
        setSettingsForm({
          fullName: session.user.user_metadata?.full_name || '',
          newPassword: '',
          confirmPassword: ''
        });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        // Admin tem acesso ilimitado
        setPlan('business');
        setScriptsUsed(0);
      } else {
        loadUserPlan();
      }
      loadHistory();
      loadScriptsUsed();
      loadAnalytics();
    }
  }, [user, isAdmin]);

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

  const loadAnalytics = async () => {
    try {
      const { count: totalCount } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: favCount } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_favorite', true);

      const { data: allScripts } = await supabase
        .from('scripts')
        .select('niche, created_at, is_favorite')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (allScripts && allScripts.length > 0) {
        const nicheCount = {};
        const timeline = {};
        allScripts.forEach(script => {
          nicheCount[script.niche] = (nicheCount[script.niche] || 0) + 1;
          const date = new Date(script.created_at).toLocaleDateString('pt-BR');
          timeline[date] = (timeline[date] || 0) + 1;
        });

        const nicheData = Object.entries(nicheCount).map(([name, value]) => ({
          name,
          value
        })).sort((a, b) => b.value - a.value);

        const timelineData = Object.entries(timeline).map(([date, count]) => ({
          date,
          scripts: count
        }));

        const topNiche = nicheData[0]?.name || 'N/A';

        setAnalyticsData({
          totalScripts: totalCount || 0,
          totalNiches: Object.keys(nicheCount).length,
          favoriteCount: favCount || 0,
          nicheData,
          timelineData,
          topNiche
        });
      }
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
    }
  };

  const handleGenerateScripts = async () => {
    if (!niche.trim()) {
      setError('Digite um nicho');
      return;
    }

    // Admin pode gerar ilimitado
    if (!isAdmin) {
      const limit = PLAN_LIMITS[plan];
      if (scriptsUsed >= limit) {
        setShowUpgradeModal(true);
        setError(`Limite atingido! Você tem ${limit} scripts/mês`);
        return;
      }
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
          const limit = isAdmin ? 999999 : PLAN_LIMITS[plan];
          
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

          if (!isAdmin) {
            await supabase
              .from('user_subscriptions')
              .update({ scripts_used: scriptsUsed + inserted })
              .eq('user_id', user.id);
          }

          setScriptsUsed(prev => prev + inserted);
          await loadHistory();
          await loadAnalytics();

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

  const handleUpdateProfile = async () => {
    setSettingsLoading(true);
    setSettingsMessage('');

    try {
      if (settingsForm.fullName !== userProfile.user_metadata?.full_name) {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: settingsForm.fullName }
        });
        if (error) throw error;
        setSettingsMessage('✅ Perfil atualizado com sucesso!');
      }

      if (settingsForm.newPassword) {
        if (settingsForm.newPassword !== settingsForm.confirmPassword) {
          throw new Error('Senhas não conferem');
        }
        const { error } = await supabase.auth.updateUser({
          password: settingsForm.newPassword
        });
        if (error) throw error;
        setSettingsForm(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: ''
        }));
        setSettingsMessage('✅ Senha alterada com sucesso!');
      }

      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (err) {
      setSettingsMessage(`❌ Erro: ${err.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ Tem certeza? Essa ação é irreversível e deletará TODOS os seus dados!')) {
      return;
    }

    setSettingsLoading(true);

    try {
      // Deletar scripts
      await supabase
        .from('scripts')
        .delete()
        .eq('user_id', user.id);

      // Deletar subscrição
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Deletar usuário
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;

      // Logout
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      setSettingsMessage(`❌ Erro: ${err.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadScript = (script) => {
    if (!isAdmin && plan === 'free') {
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

    await loadAnalytics();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScripts([]);
    setHistory([]);
    setCurrentPage('scripts');
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const card = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const input = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const chartBg = darkMode ? '#1f2937' : '#ffffff';
  const chartText = darkMode ? '#ffffff' : '#000000';

  if (loading) {
    return (
      <div className={`${bg} ${text} min-h-screen flex items-center justify-center`}>
        <p className="text-xl">⏳ Carregando...</p>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'pricing') {
      return <Pricing onSelectPlan={(planId) => setCurrentPage('scripts')} darkMode={darkMode} onNavigate={(page) => setCurrentPage(page)} />;
    }
    return <Auth onAuthSuccess={() => setUser(true)} />;
  }

  if (isAdmin && currentPage === 'admin') {
    return <Admin user={user} darkMode={darkMode} onLogout={handleLogout} />;
  }

  const scriptLimit = PLAN_LIMITS[plan];
  const scriptPercentage = isAdmin ? 100 : (scriptsUsed / scriptLimit) * 100;
  const scriptsRemaining = isAdmin ? '∞' : Math.max(0, scriptLimit - scriptsUsed);

  return (
    <div className={`${bg} ${text} min-h-screen transition-colors`}>
      {/* HEADER */}
      <header className={`${card} border-b border-gray-700 sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎬 Reels AI Pro</h1>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${isAdmin ? 'from-yellow-500 to-yellow-600' : PLAN_COLORS[plan]}`}>
              <p className="text-sm font-bold">
                {isAdmin ? '👑 ADMIN MASTER' : plan === 'free' ? '🟢 FREE' : plan === 'pro' ? '🔵 PRO' : '🟣 BUSINESS'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setCurrentPage('admin')}
                className="px-4 py-2 text-sm font-bold bg-purple-700 hover:bg-purple-600 rounded-lg transition"
              >
                👑 Admin
              </button>
            )}
            <button
              onClick={() => setCurrentPage('pricing')}
              className="px-4 py-2 text-sm font-bold bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              💳 Planos
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition flex items-center gap-2"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className={`${card} border-r border-gray-700 w-80 p-6 hidden lg:block overflow-y-auto`}>
          {/* NAV BUTTONS */}
          <div className="flex flex-col gap-2 mb-6 space-y-2">
            <button
              onClick={() => setCurrentPage('scripts')}
              className={`py-2 px-3 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
                currentPage === 'scripts'
                  ? 'bg-blue-600 text-white'
                  : `${card} border border-gray-700 hover:border-gray-600`
              }`}
            >
              <FileText size={16} /> Scripts
            </button>
            <button
              onClick={() => setCurrentPage('analytics')}
              className={`py-2 px-3 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
                currentPage === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : `${card} border border-gray-700 hover:border-gray-600`
              }`}
            >
              <BarChart3 size={16} /> Analytics
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`py-2 px-3 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
                currentPage === 'settings'
                  ? 'bg-blue-600 text-white'
                  : `${card} border border-gray-700 hover:border-gray-600`
              }`}
            >
              <Settings size={16} /> Configurações
            </button>
          </div>

          {/* PLANO CARD */}
          <div className={`bg-gradient-to-br ${isAdmin ? 'from-yellow-500 to-yellow-600' : PLAN_COLORS[plan]} rounded-xl p-6 mb-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {isAdmin ? '👑 ADMIN' : plan === 'free' ? '🟢' : plan === 'pro' ? '🔵' : '🟣'} {isAdmin ? 'MASTER' : PLAN_NAMES[plan]}
              </h3>
              {!isAdmin && plan !== 'business' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1 bg-white text-gray-900 rounded font-bold text-sm hover:bg-gray-100 transition"
                >
                  Upgrade
                </button>
              )}
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Scripts Usados</p>
                <p className="text-sm font-bold">
                  {isAdmin ? '∞' : scriptsUsed} / {isAdmin ? '∞' : scriptLimit === 999999 ? '∞' : scriptLimit}
                </p>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${Math.min(scriptPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-90">
                {isAdmin ? '∞ scripts ilimitado' : `${scriptsRemaining} scripts restantes`}
              </p>
            </div>
          </div>

          {currentPage === 'scripts' && (
            <>
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

              <div className="mb-6">
                <h4 className="font-bold text-gray-400 text-sm uppercase mb-3">❤️ Favoritos</h4>
                <p className="text-gray-500 text-sm">{favorites.length} script(s) salvo(s)</p>
              </div>
            </>
          )}

          {currentPage === 'analytics' && (
            <div className="space-y-3 mb-6">
              <div className={`${card} border border-gray-700 rounded-lg p-4`}>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Total de Scripts</p>
                <p className="text-3xl font-bold">{analyticsData.totalScripts}</p>
              </div>
              <div className={`${card} border border-gray-700 rounded-lg p-4`}>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Nichos</p>
                <p className="text-3xl font-bold">{analyticsData.totalNiches}</p>
              </div>
              <div className={`${card} border border-gray-700 rounded-lg p-4`}>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Favoritos</p>
                <p className="text-3xl font-bold text-red-500">{analyticsData.favoriteCount}</p>
              </div>
            </div>
          )}

          {!isAdmin && plan !== 'business' && (
            <div className={`bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-4 border border-purple-700`}>
              <div className="flex items-center gap-2 mb-2">
                <Crown size={18} className="text-yellow-400" />
                <h4 className="font-bold">Business</h4>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Ilimitado + agendamento + API
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
          <div className="max-w-5xl mx-auto">
            {currentPage === 'pricing' && (
              <Pricing onSelectPlan={(planId) => setCurrentPage('scripts')} darkMode={darkMode} onNavigate={(page) => setCurrentPage(page)} />
            )}

            {currentPage === 'scripts' && (
              <>
                <div className={`${card} rounded-xl p-8 mb-8 border border-gray-700 shadow-lg`}>
                  <h2 className="text-3xl font-bold mb-2">Scripts Virais com IA</h2>
                  <p className="text-gray-400 mb-6">
                    Gere scripts profissionais em segundos {!isAdmin && scriptsRemaining !== '∞' && `(${scriptsRemaining} restantes)`}
                  </p>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="Ex: Marketing Digital, Personal Trainer, Beleza..."
                      className={`flex-1 px-4 py-3 rounded-lg border ${input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      onKeyPress={(e) => e.key === 'Enter' && handleGenerateScripts()}
                    />
                    <button
                      onClick={handleGenerateScripts}
                      disabled={appLoading || (!isAdmin && scriptsRemaining === 0)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap flex items-center gap-2"
                    >
                      {!isAdmin && scriptsRemaining === 0 && <Lock size={18} />}
                      {appLoading ? '⏳ Gerando...' : '✨ Gerar'}
                    </button>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {!isAdmin && scriptsRemaining === 0 && (
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

                  {isAdmin && (
                    <div className="mt-4 p-4 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg">
                      <p className="text-yellow-300 text-sm">✨ Admin Master: Scripts ilimitados!</p>
                    </div>
                  )}
                </div>

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
              </>
            )}

            {currentPage === 'analytics' && (
              <>
                <h2 className="text-3xl font-bold mb-8">📊 Analytics Dashboard</h2>

                {analyticsData.totalScripts > 0 ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className={`${card} rounded-xl p-6 border border-gray-700`}>
                        <p className="text-gray-400 text-sm uppercase font-bold mb-2">Total Scripts</p>
                        <p className="text-4xl font-bold">{analyticsData.totalScripts}</p>
                      </div>
                      <div className={`${card} rounded-xl p-6 border border-gray-700`}>
                        <p className="text-gray-400 text-sm uppercase font-bold mb-2">Nichos</p>
                        <p className="text-4xl font-bold">{analyticsData.totalNiches}</p>
                      </div>
                      <div className={`${card} rounded-xl p-6 border border-gray-700`}>
                        <p className="text-gray-400 text-sm uppercase font-bold mb-2">Favoritos</p>
                        <p className="text-4xl font-bold text-red-500">{analyticsData.favoriteCount}</p>
                      </div>
                      <div className={`${card} rounded-xl p-6 border border-gray-700`}>
                        <p className="text-gray-400 text-sm uppercase font-bold mb-2">Nicho Top</p>
                        <p className="text-2xl font-bold truncate">{analyticsData.topNiche}</p>
                      </div>
                    </div>

                    {analyticsData.nicheData.length > 0 && (
                      <div className={`${card} rounded-xl p-6 border border-gray-700`}>
                        <h3 className="text-xl font-bold mb-4">Scripts por Nicho</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={analyticsData.nicheData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {analyticsData.nicheData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {analyticsData.timelineData.length > 0 && (
                      <div className={`${card} rounded-xl p-6 border border-gray-700`}>
                        <h3 className="text-xl font-bold mb-4">Evolução ao Longo do Tempo</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analyticsData.timelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                            <XAxis dataKey="date" stroke={chartText} />
                            <YAxis stroke={chartText} />
                            <Tooltip contentStyle={{ backgroundColor: chartBg, border: '1px solid #666' }} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="scripts"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6' }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {analyticsData.nicheData.length > 0 && (
                      <div className={`${card} rounded-xl p-6 border border-gray-700`}>
                        <h3 className="text-xl font-bold mb-4">Ranking de Nichos</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analyticsData.nicheData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                            <XAxis dataKey="name" stroke={chartText} />
                            <YAxis stroke={chartText} />
                            <Tooltip contentStyle={{ backgroundColor: chartBg, border: '1px solid #666' }} />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`${card} rounded-xl p-12 text-center border border-gray-700`}>
                    <p className="text-gray-400 text-lg">📊 Nenhum dados ainda. Gere alguns scripts para ver as estatísticas!</p>
                  </div>
                )}
              </>
            )}

            {currentPage === 'settings' && (
              <>
                <h2 className="text-3xl font-bold mb-8">⚙️ Configurações da Conta</h2>

                <div className="space-y-6">
                  {/* PERFIL */}
                  <div className={`${card} rounded-xl p-8 border border-gray-700`}>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      👤 Perfil
                    </h3>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Email</label>
                        <input
                          type="email"
                          value={userProfile.email}
                          disabled
                          className={`w-full px-4 py-3 rounded-lg border ${input} opacity-50 cursor-not-allowed`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Nome Completo</label>
                        <input
                          type="text"
                          value={settingsForm.fullName}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Seu nome"
                          className={`w-full px-4 py-3 rounded-lg border ${input}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateProfile}
                      disabled={settingsLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition"
                    >
                      {settingsLoading ? 'Salvando...' : '💾 Salvar Perfil'}
                    </button>

                    {settingsMessage && (
                      <p className={`mt-4 text-sm ${settingsMessage.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                        {settingsMessage}
                      </p>
                    )}
                  </div>

                  {/* SEGURANÇA */}
                  <div className={`${card} rounded-xl p-8 border border-gray-700`}>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      🔐 Segurança
                    </h3>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Nova Senha</label>
                        <input
                          type="password"
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Digite uma nova senha"
                          className={`w-full px-4 py-3 rounded-lg border ${input}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Confirmar Senha</label>
                        <input
                          type="password"
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirme a senha"
                          className={`w-full px-4 py-3 rounded-lg border ${input}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateProfile}
                      disabled={settingsLoading || !settingsForm.newPassword}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2"
                    >
                      <Key size={18} /> {settingsLoading ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                  </div>

                  {/* PLANO */}
                  <div className={`${card} rounded-xl p-8 border border-gray-700`}>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      💳 Plano Atual
                    </h3>

                    <div className="mb-6">
                      <p className="text-gray-400 mb-2">Você está no plano:</p>
                      <p className={`text-3xl font-bold bg-gradient-to-r ${isAdmin ? 'from-yellow-500 to-yellow-600' : PLAN_COLORS[plan]} bg-clip-text text-transparent`}>
                        {isAdmin ? '👑 ADMIN MASTER' : PLAN_NAMES[plan]} {!isAdmin && plan === 'free' ? '(Gratuito)' : ''}
                      </p>
                    </div>

                    {!isAdmin && plan !== 'business' && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-lg hover:opacity-90 transition flex items-center gap-2"
                      >
                        <Crown size={18} /> Upgrade para Business
                      </button>
                    )}
                  </div>

                  {/* DELETAR CONTA */}
                  {!isAdmin && (
                    <div className={`${card} rounded-xl p-8 border border-red-700 bg-red-500 bg-opacity-5`}>
                      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-red-500">
                        <AlertCircle size={24} /> Zona de Perigo
                      </h3>

                      <p className="text-gray-400 mb-6">Deletar sua conta é uma ação irreversível. Todos os seus dados serão removidos permanentemente.</p>

                      <button
                        onClick={handleDeleteAccount}
                        disabled={settingsLoading}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2"
                      >
                        <Trash2 size={18} /> {settingsLoading ? 'Deletando...' : 'Deletar Conta Permanentemente'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && !isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${card} rounded-2xl p-8 max-w-2xl w-full border border-gray-700`}>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Crown size={28} className="text-yellow-400" /> Escolha seu Plano
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className={`rounded-lg p-6 border-2 transition cursor-pointer ${plan === 'free' ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-700 hover:border-gray-600'}`}>
                <h3 className="text-xl font-bold mb-2">🟢 Free</h3>
                <p className="text-2xl font-bold mb-4">R$ 0</p>
                <div className="space-y-2 text-sm mb-4">
                  <p>✓ 5 scripts/mês</p>
                  <p>✓ Histórico</p>
                  <p>✗ Download</p>
                </div>
                {plan === 'free' && <p className="text-blue-400 text-sm font-bold">Seu plano atual</p>}
              </div>

              <div className={`rounded-lg p-6 border-2 transition cursor-pointer ${plan === 'pro' ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-700 hover:border-gray-600'}`}>
                <h3 className="text-xl font-bold mb-2">🔵 Pro</h3>
                <p className="text-2xl font-bold mb-4">R$ 39<span className="text-sm">/mês</span></p>
                <div className="space-y-2 text-sm mb-4">
                  <p>✓ 50 scripts/mês</p>
                  <p>✓ Download</p>
                  <p>✓ Analytics</p>
                </div>
                {plan === 'pro' && <p className="text-blue-400 text-sm font-bold">Seu plano atual</p>}
                {plan !== 'pro' && (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition text-sm">
                    Upgrade
                  </button>
                )}
              </div>

              <div className={`rounded-lg p-6 border-2 transition cursor-pointer ${plan === 'business' ? 'border-purple-500 bg-purple-500 bg-opacity-10' : 'border-gray-700 hover:border-gray-600'}`}>
                <h3 className="text-xl font-bold mb-2">🟣 Business</h3>
                <p className="text-2xl font-bold mb-4">R$ 149<span className="text-sm">/mês</span></p>
                <div className="space-y-2 text-sm mb-4">
                  <p>✓ Ilimitado</p>
                  <p>✓ Agendamento</p>
                  <p>✓ API</p>
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