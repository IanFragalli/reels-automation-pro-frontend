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

  // Verificar login
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  // Carregar histórico quando user muda
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('scripts')
      .select('niche, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const uniqueNiches = [];
      const seen = new Set();
      
      data.forEach(item => {
        if (!seen.has(item.niche)) {
          seen.add(item.niche);
          uniqueNiches.push({
            niche: item.niche,
            timestamp: new Date(item.created_at).toLocaleString()
          });
        }
      });
      
      setHistory(uniqueNiches);
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

      if (data.success && data.scripts.length > 0) {
        setScripts(data.scripts);

        // Salvar no Supabase
        if (user) {
          for (const script of data.scripts) {
            await supabase.from('scripts').insert({
              user_id: user.id,
              niche,
              titulo: script.titulo,
              gancho: script.gancho,
              desenvolvimento: script.desenvolvimento,
              cta: script.cta,
              duracao: script.duracao,
              dificuldade: script.dificuldade
            });
          }
          loadHistory();
        }
      } else {
        setError('Nenhum script gerado');
      }
    } catch (err) {
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

  const toggleFavorite = async (scriptTitle) => {
    if (!user) return;
    
    const isFav = favorites.includes(scriptTitle);