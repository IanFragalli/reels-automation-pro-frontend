import { useState, useEffect } from 'react';
import { Copy, Download, Share2, Heart, Zap, Lock, Crown, BarChart3, FileText, Settings, LogOut, Mail, Key, Trash2, AlertCircle, Loader, ExternalLink, Clock, Tag } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import Pricing from './Pricing';
import ProfileSetup from './ProfileSetup';
import Admin from './Admin';

const PRICING_PLANS = {
  free: {
    name: 'Free',
    emoji: '🎁',
    price: 'R$ 0',
    period: 'Para sempre',
    credits: 5,
    color: 'from-gray-500 to-gray-600',
    features: [
      { text: '5 scripts/mês', included: true },
      { text: 'Hashtags básicas (2)', included: true },
      { text: 'Histórico', included: true },
      { text: 'Download', included: false },
      { text: 'URLs de referência', included: false },
      { text: 'Estimativa de tempo', included: false }
    ]
  },
  premium: {
    name: 'Premium',
    emoji: '⭐',
    price: 'R$ 49',
    period: '/mês',
    credits: 60,
    color: 'from-blue-500 to-blue-600',
    highlight: true,
    features: [
      { text: '60 scripts/mês', included: true },
      { text: 'Hashtags de alto engajamento', included: true },
      { text: 'URLs de referência (Instagram/YouTube/TikTok)', included: true },
      { text: 'Download completo', included: true },
      { text: 'Estimativa de tempo de vídeo', included: true },
      { text: 'Analytics avançado', included: true }
    ]
  },
  top: {
    name: 'Top',
    emoji: '👑',
    price: 'R$ 149',
    period: '/mês',
    credits: 250,
    color: 'from-purple-500 to-purple-600',
    features: [
      { text: '250 scripts/mês', included: true },
      { text: 'Hashtags de alto engajamento', included: true },
      { text: 'URLs de referência premium', included: true },
      { text: 'Download ilimitado', included: true },
      { text: 'Estimativa de tempo exata', included: true },
      { text: 'Analytics completo + IA insights', included: true }
    ]
  }
};

const PLAN_LIMITS = {
  free: 5,
  premium: 60,
  top: 250
};

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  const [niche, setNiche] = useState('');
  const [scripts, setScripts] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [copied, setCopied] = useState(null);
  const [plan, setPlan] = useState('free');
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('scripts');
  
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
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const isAdmin = user?.email === 'ianfragalli@hotmail.com';

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setSettingsForm({
          fullName: session.user.user_metadata?.full_name || '',
          newPassword: '',
          confirmPassword: ''
        });
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => unsubscribe?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        setPlan('top');
        setCreditsUsed(0);
      } else {
        loadUserPlan();
      }
      loadHistory();
      loadCreditsUsed();
      loadAnalytics();
    }
  }, [user, isAdmin]);

  const loadUserProfile = async (userId) => {
    try {
      const { data, error: err } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (err && err.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', err);
        setShowProfileSetup(true);
      } else if (data) {
        setUserProfile(data);
      } else {
        setShowProfileSetup(true);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setShowProfileSetup(true);
    }
  };

  const loadUserPlan = async () => {
    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('plan, credits_used')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPlan(data.plan || 'free');
        setCreditsUsed(data.credits_used || 0);
      } else {
        await supabase.from('user_subscriptions').insert({
          user_id: user.id,
          plan: 'free',
          credits_limit: 5,
          credits_used: 0
        });
        setPlan('free');
        setCreditsUsed(0);
      }
    } catch (err) {
      console.error('Erro ao carregar plano:', err);
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
            timestamp: new Date(h.created_at).toLocaleString('pt-BR')
          }));
        setHistory(unique);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const loadCreditsUsed = async () => {
    try {
      const { count } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setCreditsUsed(count || 0);
    } catch (err) {
      console.error('Erro ao contar créditos:', err);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
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
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const generateHashtags = (scriptTitle, userPlan) => {
    const basicHashtags = ['#ReelFlow', '#IA'];
    
    if (userPlan === 'free') {
      return basicHashtags;
    }

    const keywords = scriptTitle.toLowerCase().split(' ');
    const hashtagMap = {
      'marketing': ['#MarketingDigital', '#EstrategiaDeMarketing'],
      'beleza': ['#BeautifulMakeup', '#SkinCare'],
      'fitness': ['#FitnessMotivation', '#WorkoutOfTheDay'],
      'tech': ['#TechTrends', '#Inovação'],
      'educação': ['#EducaçãoOnline', '#Aprendizado'],
      'culinária': ['#CulináriaArtesanal', '#ReceitaFácil'],
      'moda': ['#FashionTrend', '#StyleInspo'],
      'viagem': ['#ViajarPelaMundo', '#TravelBlog'],
      'lifestyle': ['#LifestyleBlog', '#DailyLife']
    };

    let recommendedHashtags = [...basicHashtags];
    for (const keyword of keywords) {
      if (hashtagMap[keyword]) {
        recommendedHashtags = [...recommendedHashtags, ...hashtagMap[keyword]];
        break;
      }
    }

    return recommendedHashtags.slice(0, 10);
  };

  const generateReferenceURLs = (scriptTitle, userPlan) => {
    if (userPlan === 'free') {
      return [];
    }

    const referenceURLs = {
      instagram: 'https://instagram.com/explore/tags/' + scriptTitle.replace(/\s+/g, ''),
      youtube: 'https://youtube.com/search?q=' + scriptTitle,
      tiktok: 'https://www.tiktok.com/search?q=' + scriptTitle
    };

    return Object.entries(referenceURLs).map(([platform, url]) => ({
      platform,
      url,
      emoji: platform === 'instagram' ? '📷' : platform === 'youtube' ? '🎥' : '🎵'
    }));
  };

  const estimateVideoDuration = (script, userPlan) => {
    if (userPlan === 'free') {
      return '3-15 segundos (recomendado)';
    }

    const totalChars = script.gancho.length + script.desenvolvimento.length + script.cta.length;
    const estimatedSeconds = Math.ceil(totalChars / 10);
    
    return `${Math.min(3, estimatedSeconds)}-${Math.max(15, estimatedSeconds)} segundos`;
  };

  const handleGenerateScripts = async () => {
    if (!niche.trim()) {
      setError('Por favor, digite um nicho');
      return;
    }

    if (!isAdmin) {
      const limit = PLAN_LIMITS[plan];
      if (creditsUsed >= limit) {
        setShowUpgradeModal(true);
        setError(`Limite atingido! Você tem ${limit} scripts/mês`);
        return;
      }
    }

    setAppLoading(true);
    setError('');
    setSuccess('');

    try {
      const userContext = userProfile ? `Contexto do usuário: Interesse em ${userProfile.interests?.join(', ')} | Cidade: ${userProfile.city}` : '';
      
      const response = await fetch('https://reels-automation-pro.vercel.app/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userData: { 
            niche,
            userContext
          }
        })
      });

      const data = await response.json();

      if (data.success && data.scripts && data.scripts.length > 0) {
        const enrichedScripts = data.scripts.map(script => ({
          ...script,
          hashtags: generateHashtags(script.titulo, plan),
          reference_urls: generateReferenceURLs(script.titulo, plan),
          video_duration: estimateVideoDuration(script, plan)
        }));

        setScripts(enrichedScripts);
        setSuccess(`✨ ${enrichedScripts.length} scripts gerados com sucesso!`);

        if (user) {
          let inserted = 0;
          const limit = isAdmin ? 999999 : PLAN_LIMITS[plan];
          
          for (const script of enrichedScripts) {
            if (creditsUsed + inserted >= limit) break;

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
                  hashtags: script.hashtags,
                  video_duration: script.video_duration,
                  reference_urls: script.reference_urls,
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
              .update({ credits_used: creditsUsed + inserted })
              .eq('user_id', user.id);
          }

          setCreditsUsed(prev => prev + inserted);
          await loadHistory();
          await loadAnalytics();
        }
      } else {
        setError('Não foi possível gerar scripts. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao gerar scripts. Verifique sua conexão.');
    } finally {
      setAppLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSettingsLoading(true);
    setSettingsMessage('');

    try {
      let updated = false;

      if (settingsForm.fullName !== user.user_metadata?.full_name) {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: settingsForm.fullName }
        });
        if (error) throw error;
        updated = true;
      }

      if (settingsForm.newPassword) {
        if (settingsForm.newPassword !== settingsForm.confirmPassword) {
          throw new Error('As senhas não conferem');
        }
        if (settingsForm.newPassword.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
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
        updated = true;
      }

      if (updated) {
        setSettingsMessage('✅ Perfil atualizado com sucesso!');
      } else {
        setSettingsMessage('ℹ️ Nenhuma alteração foi feita');
      }
    } catch (err) {
      setSettingsMessage(`❌ ${err.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ Tem CERTEZA? Isso vai deletar TUDO permanentemente!')) {
      return;
    }

    setSettingsLoading(true);

    try {
      await supabase.from('scripts').delete().eq('user_id', user.id);
      await supabase.from('user_profiles').delete().eq('user_id', user.id);
      await supabase.from('user_subscriptions').delete().eq('user_id', user.id);
      
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;

      await supabase.auth.signOut();
      setUser(null);
      setCurrentPage('scripts');
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

    const hashtags = script.hashtags?.join(' ') || '';
    const references = script.reference_urls?.length > 0 
      ? '\n\nREFERÊNCIAS:\n' + script.reference_urls.map(r => `${r.emoji} ${r.platform}: ${r.url}`).join('\n')
      : '';

    const text = `SCRIPT: ${script.titulo}\n\nGANCHO:\n${script.gancho}\n\nDESENVOLVIMENTO:\n${script.desenvolvimento}\n\nCTA:\n${script.cta}\n\nHASTAGS:\n${hashtags}\n\nDURAÇÃO: ${script.video_duration || script.duracao}\nDIFICULDADE: ${script.dificuldade}${references}`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${script.titulo.slice(0, 20)}.txt`;
    a.click();
    setSuccess('📥 Script baixado com sucesso!');
  };

  const shareScript = (script) => {
    const hashtags = script.hashtags?.join(' ') || '';
    const text = `${script.titulo}\n\n${script.gancho}\n\n${hashtags}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleFavorite = async (scriptTitle) => {
    if (!user) return;
    const isFav = favorites.includes(scriptTitle);

    try {
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
      setSuccess(isFav ? '❤️ Removido de favoritos' : '❤️ Adicionado a favoritos');
    } catch (err) {
      setError('Erro ao atualizar favorito');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScripts([]);
    setHistory([]);
    setCurrentPage('scripts');
  };

  const bg = darkMode 
    ? 'bg-gray-900' 
    : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const card = darkMode 
    ? 'bg-gray-800' 
    : 'bg-white shadow-sm';
  const input = darkMode 
    ? 'bg-gray-700 text-white border-gray-600' 
    : 'bg-blue-50 text-gray-900 border-blue-200';
  const chartBg = darkMode ? '#1f2937' : '#ffffff';
  const chartText = darkMode ? '#ffffff' : '#000000';

  if (loading) {
    return (
      <div className={`${bg} ${text} min-h-screen flex flex-col items-center justify-center gap-4`}>
        <div className="text-6xl animate-bounce">🎬</div>
        <Loader size={40} className="animate-spin text-blue-500" />
        <p className="text-lg font-semibold">Carregando ReelFlow...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setUser(true)} />;
  }

  if (showProfileSetup) {
    return (
      <ProfileSetup 
        user={user} 
        darkMode={darkMode} 
        onComplete={async () => {
          await loadUserProfile(user.id);
          setShowProfileSetup(false);
          setCurrentPage('scripts');
        }} 
      />
    );
  }

  if (isAdmin && currentPage === 'admin') {
    return <Admin user={user} darkMode={darkMode} onLogout={handleLogout} />;
  }

  const creditLimit = PLAN_LIMITS[plan];
  const creditPercentage = isAdmin ? 100 : (creditsUsed / creditLimit) * 100;
  const creditsRemaining = isAdmin ? '∞' : Math.max(0, creditLimit - creditsUsed);

  return (
    <div className={`${bg} ${text} min-h-screen transition-colors duration-300`}>
      <header className={`${card} border-b ${darkMode ? 'border-gray-700' : 'border-blue-100'} sticky top-0 z-40 backdrop-blur-md bg-opacity-95`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎬</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ReelFlow
              </h1>
              <p className="text-xs text-gray-500">Scripts virais com IA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
            <div className={`px-3 md:px-4 py-2 rounded-full bg-gradient-to-r ${PRICING_PLANS[plan].color} text-white text-xs md:text-sm font-bold transition-all`}>
              {PRICING_PLANS[plan].emoji} {PRICING_PLANS[plan].name}
            </div>

            {isAdmin && (
              <button
                onClick={() => setCurrentPage('admin')}
                className="px-3 py-2 text-xs md:text-sm font-bold bg-yellow-600 hover:bg-yellow-700 rounded-full transition transform hover:scale-105"
              >
                👑 Admin
              </button>
            )}

            <button
              onClick={() => setCurrentPage('pricing')}
              className="px-3 py-2 text-xs md:text-sm font-bold rounded-full transition transform hover:scale-105"
              style={{
                background: darkMode ? '#4b5563' : '#e0e7ff',
                color: darkMode ? '#fff' : '#1e40af'
              }}
            >
              💳
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition transform hover:scale-110 ${darkMode ? 'bg-gray-700' : 'bg-blue-100'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-full text-xs md:text-sm font-bold transition transform hover:scale-105 flex items-center gap-1"
            >
              <LogOut size={16} className="hidden md:block" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className={`${card} border-b lg:border-r ${darkMode ? 'border-gray-700' : 'border-blue-100'} w-full lg:w-80 p-4 md:p-6 hidden lg:block overflow-y-auto`}>
          <div className="flex flex-col gap-2 mb-6 space-y-2">
            {[
              { id: 'scripts', label: 'Scripts', icon: '📝' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
              { id: 'settings', label: 'Configurações', icon: '⚙️' }
            ].map(nav => (
              <button
                key={nav.id}
                onClick={() => setCurrentPage(nav.id)}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition transform hover:scale-105 ${
                  currentPage === nav.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-900'
                }`}
              >
                {nav.icon} {nav.label}
              </button>
            ))}
          </div>

          <div className={`bg-gradient-to-br ${PRICING_PLANS[plan].color} rounded-2xl p-6 mb-6 text-white shadow-xl transform transition hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black">
                {PRICING_PLANS[plan].emoji} {PRICING_PLANS[plan].name}
              </h3>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Scripts Gerados</p>
                <p className="text-sm font-bold">
                  {isAdmin ? '∞' : creditsUsed} / {isAdmin ? '∞' : creditLimit}
                </p>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(creditPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-90">
                {isAdmin ? '∞ ilimitado' : `${creditsRemaining} restantes`}
              </p>
            </div>

            {!isAdmin && plan !== 'top' && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full py-2 bg-white text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-100 transition transform hover:scale-105"
              >
                ⬆️ Upgrade
              </button>
            )}
          </div>

          {currentPage === 'scripts' && (
            <>
              <div className="mb-6">
                <h4 className={`font-bold text-sm uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                  📌 Histórico
                </h4>
                {history.length === 0 ? (
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-blue-400'}`}>Nenhuma busca ainda</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => setNiche(h.niche)}
                        className={`w-full text-left p-3 rounded-lg transition transform hover:scale-105 ${
                          darkMode 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-blue-100'
                        }`}
                      >
                        <p className="font-medium text-sm truncate">{h.niche}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-blue-400'}`}>
                          {h.timestamp}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className={`font-bold text-sm uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                  ❤️ Favoritos
                </h4>
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-blue-500'}`}>
                  {favorites.length} script(s)
                </p>
              </div>
            </>
          )}

          {currentPage === 'analytics' && (
            <div className="space-y-3 mb-6">
              {[
                { label: 'Total de Scripts', value: analyticsData.totalScripts, icon: '📊' },
                { label: 'Nichos', value: analyticsData.totalNiches, icon: '🎯' },
                { label: 'Favoritos', value: analyticsData.favoriteCount, icon: '❤️' }
              ].map((stat, i) => (
                <div key={i} className={`${card} rounded-lg p-4 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} hover:border-gray-600 transition`}>
                  <p className={`text-xs uppercase font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                    {stat.icon} {stat.label}
                  </p>
                  <p className="text-3xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {error && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top border ${
                darkMode
                  ? 'bg-red-500 bg-opacity-20 border-red-500'
                  : 'bg-red-50 border-red-200'
              }`}>
                <AlertCircle className={`${darkMode ? 'text-red-400' : 'text-red-600'} flex-shrink-0 mt-1`} size={20} />
                <p className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
              </div>
            )}
            {success && (
              <div className={`mb-6 p-4 rounded-xl animate-in fade-in slide-in-from-top border ${
                darkMode
                  ? 'bg-green-500 bg-opacity-20 border-green-500'
                  : 'bg-green-50 border-green-200'
              }`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{success}</p>
              </div>
            )}

            {currentPage === 'pricing' && (
              <Pricing onSelectPlan={(planId) => setCurrentPage('scripts')} darkMode={darkMode} onNavigate={(page) => setCurrentPage(page)} />
            )}

            {currentPage === 'scripts' && (
              <>
                <div className={`${card} rounded-3xl p-6 md:p-8 mb-8 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-xl`}>
                  <div className="mb-6">
                    <h2 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Scripts Virais com IA
                    </h2>
                    <p className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                      Gere scripts profissionais em segundos {!isAdmin && creditsRemaining !== '∞' && `(${creditsRemaining} restantes)`}
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="Ex: Marketing Digital, Personal Trainer, Beleza..."
                      className={`flex-1 px-4 py-3 rounded-xl border ${input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                      onKeyPress={(e) => e.key === 'Enter' && handleGenerateScripts()}
                    />
                    <button
                      onClick={handleGenerateScripts}
                      disabled={appLoading || (!isAdmin && creditsRemaining === 0)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 disabled:opacity-50 transition transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg"
                    >
                      {appLoading ? <Loader size={18} className="animate-spin" /> : '✨'}
                      {appLoading ? 'Gerando...' : 'Gerar'}
                    </button>
                  </div>

                  {isAdmin && (
                    <div className={`p-3 rounded-lg text-sm font-medium border ${
                      darkMode
                        ? 'bg-yellow-500 bg-opacity-20 border-yellow-500 text-yellow-300'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}>
                      ✨ Admin Master: Scripts ilimitados!
                    </div>
                  )}

                  {!isAdmin && creditsRemaining === 0 && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 border ${
                      darkMode
                        ? 'bg-yellow-500 bg-opacity-20 border-yellow-500'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <Zap className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'} flex-shrink-0 mt-1`} size={20} />
                      <div>
                        <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                          Limite atingido!
                        </p>
                        <p className={`text-xs mb-3 ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                          Você usou todos os {creditLimit} scripts do seu plano.
                        </p>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg font-bold text-sm transition transform hover:scale-105"
                        >
                          ⬆️ Upgrade Agora
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {scripts.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-black mb-6">📝 {scripts.length} Scripts Gerados</h2>
                    <div className="space-y-6">
                      {scripts.map((s, i) => (
                        <div
                          key={i}
                          className={`${card} rounded-2xl p-6 border-l-4 border-blue-500 border ${
                            darkMode ? 'border-gray-700' : 'border-blue-200'
                          } shadow-lg hover:shadow-2xl transition transform hover:scale-[1.01]`}
                        >
                          <div className="flex items-start justify-between mb-4 gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg md:text-xl font-bold mb-3">{s.titulo}</h3>
                              <div className="flex gap-2 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  darkMode
                                    ? 'bg-blue-500 bg-opacity-20 text-blue-300'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  ⏱️ {s.video_duration || s.duracao}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  darkMode
                                    ? 'bg-green-500 bg-opacity-20 text-green-300'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  📈 {s.dificuldade}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleFavorite(s.titulo)}
                              className="transition transform hover:scale-125"
                            >
                              <Heart
                                size={28}
                                fill={favorites.includes(s.titulo) ? 'currentColor' : 'none'}
                                className={
                                  favorites.includes(s.titulo)
                                    ? 'text-red-500'
                                    : `${darkMode ? 'text-gray-500 hover:text-red-500' : 'text-gray-400 hover:text-red-500'}`
                                }
                              />
                            </button>
                          </div>

                          <div className="space-y-4 mb-6">
                            {[
                              { label: '🎯 Gancho (0-3s)', content: s.gancho, id: `gancho-${i}` },
                              { label: '📝 Desenvolvimento', content: s.desenvolvimento, id: `dev-${i}` },
                              { label: '📢 Call-to-Action', content: s.cta, id: `cta-${i}` }
                            ].map((section, idx) => {
                              const isCTA = section.label.includes('Call');
                              const ctaColor = isCTA ? (darkMode ? 'text-blue-400' : 'text-blue-600') : '';
                              return (
                                <div key={idx}>
                                  <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                                    {section.label}
                                  </p>
                                  <p className={`text-sm leading-relaxed mb-2 font-semibold ${ctaColor}`}>
                                    {section.content}
                                  </p>
                                  <button
                                    onClick={() => copyToClipboard(section.content, section.id)}
                                    className={`text-xs flex items-center gap-1 transition transform hover:scale-105 ${
                                      darkMode
                                        ? 'text-blue-400 hover:text-blue-300'
                                        : 'text-blue-600 hover:text-blue-700'
                                    }`}
                                  >
                                    <Copy size={14} />
                                    {copied === section.id ? 'Copiado!' : 'Copiar'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {s.hashtags && s.hashtags.length > 0 && (
                            <div className={`mb-4 p-4 rounded-lg border ${
                              darkMode
                                ? 'bg-purple-500 bg-opacity-10 border-purple-500 border-opacity-30'
                                : 'bg-purple-50 border-purple-200'
                            }`}>
                              <p className={`text-xs font-bold uppercase mb-2 flex items-center gap-1 ${
                                darkMode ? 'text-purple-400' : 'text-purple-600'
                              }`}>
                                <Tag size={14} /> Hashtags {plan !== 'free' && '(Alto Engajamento)'}
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {s.hashtags.map((tag, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => copyToClipboard(tag, `hashtag-${i}-${idx}`)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition transform hover:scale-110 ${
                                      darkMode
                                        ? 'bg-purple-600 text-purple-100 hover:bg-purple-500'
                                        : 'bg-purple-200 text-purple-800 hover:bg-purple-300'
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                              {copied && copied.includes('hashtag') && (
                                <p className="text-xs text-green-500 mt-2">✓ Copiado!</p>
                              )}
                            </div>
                          )}

                          {plan !== 'free' && s.reference_urls && s.reference_urls.length > 0 ? (
                            <div className={`mb-4 p-4 rounded-lg border ${
                              darkMode
                                ? 'bg-cyan-500 bg-opacity-10 border-cyan-500 border-opacity-30'
                                : 'bg-cyan-50 border-cyan-200'
                            }`}>
                              <p className={`text-xs font-bold uppercase mb-2 flex items-center gap-1 ${
                                darkMode ? 'text-cyan-400' : 'text-cyan-600'
                              }`}>
                                <ExternalLink size={14} /> URLs de Referência
                              </p>
                              <div className="space-y-2">
                                {s.reference_urls.map((ref, idx) => (
                                  <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded transition transform hover:scale-105 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-cyan-100'}`}>
                                    <span>{ref.emoji}</span>
                                    <span className={`text-sm font-semibold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                      {ref.platform.toUpperCase()}
                                    </span>
                                    <ExternalLink size={14} className={darkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-700">
                            <button
                              onClick={() => downloadScript(s)}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition transform hover:scale-105 text-sm font-medium ${
                                darkMode
                                  ? 'bg-gray-700 hover:bg-gray-600'
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-900'
                              }`}
                            >
                              <Download size={18} /> Baixar
                            </button>
                            <button
                              onClick={() => shareScript(s)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition transform hover:scale-105 text-sm font-medium text-white"
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
                  <div className={`${card} rounded-3xl p-12 text-center border-2 border-dashed ${
                    darkMode ? 'border-gray-700' : 'border-blue-200'
                  }`}>
                    <p className="text-5xl mb-4">🎯</p>
                    <p className={`text-lg font-semibold ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                      Digite um nicho para começar
                    </p>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-blue-500'}`}>
                      Crie scripts virais incríveis em segundos!
                    </p>
                  </div>
                )}
              </>
            )}

            {currentPage === 'analytics' && (
              <>
                <h2 className="text-3xl md:text-4xl font-black mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  📊 Analytics Dashboard
                </h2>

                {analyticsLoading ? (
                  <div className="flex items-center justify-center gap-4 py-12">
                    <Loader className="animate-spin text-blue-500" size={32} />
                    <p className={darkMode ? 'text-gray-400' : 'text-blue-600'}>Carregando dados...</p>
                  </div>
                ) : analyticsData.totalScripts > 0 ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Scripts', value: analyticsData.totalScripts, icon: '📊', color: 'from-blue-500' },
                        { label: 'Nichos', value: analyticsData.totalNiches, icon: '🎯', color: 'from-purple-500' },
                        { label: 'Favoritos', value: analyticsData.favoriteCount, icon: '❤️', color: 'from-red-500' },
                        { label: 'Nicho Top', value: analyticsData.topNiche, icon: '⭐', color: 'from-yellow-500' }
                      ].map((stat, i) => (
                        <div key={i} className={`${card} rounded-2xl p-6 border ${
                          darkMode ? 'border-gray-700' : 'border-blue-200'
                        } hover:border-gray-600 transition transform hover:scale-105 shadow-lg`}>
                          <div className={`text-2xl mb-3 bg-gradient-to-r ${stat.color} to-pink-500 bg-clip-text text-transparent`}>
                            {stat.icon}
                          </div>
                          <p className={`text-sm uppercase font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                            {stat.label}
                          </p>
                          <p className="text-4xl font-black">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {analyticsData.nicheData.length > 0 && (
                      <div className={`${card} rounded-2xl p-6 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-lg`}>
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
                      <div className={`${card} rounded-2xl p-6 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-lg`}>
                        <h3 className="text-xl font-bold mb-4">Evolução ao Longo do Tempo</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analyticsData.timelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                            <XAxis dataKey="date" stroke={chartText} />
                            <YAxis stroke={chartText} />
                            <Tooltip contentStyle={{ backgroundColor: chartBg, border: '1px solid #666' }} />
                            <Legend />
                            <Line type="monotone" dataKey="scripts" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {analyticsData.nicheData.length > 0 && (
                      <div className={`${card} rounded-2xl p-6 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-lg`}>
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
                  <div className={`${card} rounded-3xl p-12 text-center border-2 border-dashed ${
                    darkMode ? 'border-gray-700' : 'border-blue-200'
                  }`}>
                    <p className="text-4xl mb-4">📉</p>
                    <p className={`text-lg font-semibold ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                      Nenhum dado ainda
                    </p>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-blue-500'}`}>
                      Gere alguns scripts para ver as estatísticas!
                    </p>
                  </div>
                )}
              </>
            )}

            {currentPage === 'settings' && (
              <>
                <h2 className="text-3xl md:text-4xl font-black mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ⚙️ Configurações
                </h2>

                <div className="space-y-6">
                  <div className={`${card} rounded-2xl p-6 md:p-8 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-lg`}>
                    <h3 className="text-2xl font-bold mb-6">👤 Perfil</h3>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email || ''}
                          disabled
                          className={`w-full px-4 py-3 rounded-lg border ${input} opacity-50 cursor-not-allowed`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          value={settingsForm.fullName}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Seu nome"
                          className={`w-full px-4 py-3 rounded-lg border ${input} transition focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={settingsLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition transform hover:scale-105"
                    >
                      {settingsLoading ? '⏳ Salvando...' : '💾 Salvar Perfil'}
                    </button>
                    {settingsMessage && (
                      <p className={`mt-4 text-sm font-medium ${settingsMessage.includes('❌') ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-green-400' : 'text-green-600')}`}>
                        {settingsMessage}
                      </p>
                    )}
                  </div>

                  <div className={`${card} rounded-2xl p-6 md:p-8 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-lg`}>
                    <h3 className="text-2xl font-bold mb-6">🔐 Segurança</h3>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                          Nova Senha
                        </label>
                        <input
                          type="password"
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Digite uma nova senha"
                          className={`w-full px-4 py-3 rounded-lg border ${input} transition focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                          Confirmar Senha
                        </label>
                        <input
                          type="password"
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirme a senha"
                          className={`w-full px-4 py-3 rounded-lg border ${input} transition focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={settingsLoading || !settingsForm.newPassword}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition transform hover:scale-105 flex items-center gap-2"
                    >
                      <Key size={18} /> {settingsLoading ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                  </div>

                  <div className={`${card} rounded-2xl p-6 md:p-8 border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-lg`}>
                    <h3 className="text-2xl font-bold mb-6">💳 Plano Atual</h3>
                    <div className={`bg-gradient-to-r ${PRICING_PLANS[plan].color} bg-clip-text text-transparent text-4xl font-black mb-6`}>
                      {PRICING_PLANS[plan].emoji} {PRICING_PLANS[plan].name}
                    </div>
                    {!isAdmin && plan !== 'top' && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-lg hover:opacity-90 transition transform hover:scale-105 flex items-center gap-2"
                      >
                        <Crown size={18} /> Upgrade
                      </button>
                    )}
                  </div>

                  {!isAdmin && (
                    <div className={`${card} rounded-2xl p-6 md:p-8 border border-red-700 bg-red-500 ${darkMode ? 'bg-opacity-5' : 'bg-opacity-10'} shadow-lg`}>
                      <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-red-500' : 'text-red-600'}`}>
                        <AlertCircle size={28} /> Zona de Perigo
                      </h3>
                      <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Deletar sua conta é irreversível.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={settingsLoading}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition transform hover:scale-105 flex items-center gap-2"
                      >
                        <Trash2 size={18} /> Deletar Conta
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {showUpgradeModal && !isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className={`${card} rounded-3xl p-8 max-w-3xl w-full border ${darkMode ? 'border-gray-700' : 'border-blue-200'} shadow-2xl scale-in`}>
            <h2 className="text-3xl font-black mb-8 flex items-center gap-2">
              <Crown size={32} className="text-yellow-400" /> Escolha seu Plano
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {Object.entries(PRICING_PLANS).map(([key, tier]) => (
                <div
                  key={key}
                  className={`rounded-2xl p-6 border-2 transition transform hover:scale-105 ${
                    plan === key
                      ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                      : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-blue-200 hover:border-blue-300'
                  } ${tier.highlight ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <h3 className="text-xl font-bold mb-2">{tier.emoji} {tier.name}</h3>
                  <p className="text-2xl font-bold mb-1 text-blue-500">{tier.price}</p>
                  <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{tier.period}</p>
                  <p className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {tier.credits} scripts/mês
                  </p>
                  <div className="space-y-2 text-sm mb-4">
                    {tier.features.map((f, i) => (
                      <p key={i} className={f.included ? (darkMode ? 'text-gray-300' : 'text-gray-700') : (darkMode ? 'text-gray-500' : 'text-gray-400')}>
                        {f.included ? '✓ ' : '✗ '} {f.text}
                      </p>
                    ))}
                  </div>
                  {plan === key && (
                    <p className="text-blue-400 text-sm font-bold">✓ Seu plano atual</p>
                  )}
                  {plan !== key && (
                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-bold py-2 px-3 rounded-lg transition transform hover:scale-105 text-sm">
                      {key === 'premium' ? 'R$ 49/mês' : 'R$ 149/mês'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className={`w-full font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-900'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}