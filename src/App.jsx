import { useState } from 'react';

export default function App() {
  const [niche, setNiche] = useState('');
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      } else {
        setError('Nenhum script gerado');
      }
    } catch (err) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          🎬 Reels Automation Pro
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Gere scripts virais para Instagram com IA
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qual é o seu nicho?
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Ex: Marketing Digital, Personal Trainer, etc"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {loading ? '⏳ Gerando...' : '✨ Gerar Scripts Grátis'}
          </button>

          {error && (
            <p className="mt-4 text-red-600 text-center">{error}</p>
          )}
        </div>

        {scripts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📝 {scripts.length} Scripts Gerados
            </h2>

            {scripts.map((script, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    #{idx + 1} {script.titulo}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      ⏱️ {script.duracao}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      📈 {script.dificuldade}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">🎯 GANCHO (primeiros 3s)</p>
                    <p className="text-gray-800">{script.gancho}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-semibold">📝 DESENVOLVIMENTO</p>
                    <p className="text-gray-800">{script.desenvolvimento}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-semibold">📢 CTA (Call-to-Action)</p>
                    <p className="text-gray-800 font-medium">{script.cta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}