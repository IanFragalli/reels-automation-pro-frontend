import React, { useState } from 'react';
import { ChevronRight, Sparkles, Loader } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState('welcome');
  const [userData, setUserData] = useState({});
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateScripts = async () => {
    setLoading(true);
    setStep('generating');

    try {
      // Chamada ao backend
      const response = await fetch('/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          userData: userData
        })
      });

      const data = await response.json();
      setScripts(data.scripts || []);
      setStep('scripts');
    } catch (error) {
      console.error('Erro:', error);
      // Mock data se falhar
      setScripts([{
        titulo: 'Os 3 Segredos',
        gancho: 'Você não sabe isto',
        desenvolvimento: 'Explicação aqui',
        cta: 'Clique para saber mais',
        duracao: '22s',
        dificuldade: 'Fácil'
      }]);
      setStep('scripts');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="text-purple-600" size={32} />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Reels Automation Pro
            </h1>
          </div>
          <p className="text-xl text-gray-700 mb-12">
            Gere scripts virais em 60 segundos
          </p>
          <button
            onClick={() => setStep('questionnaire')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg flex items-center gap-2 mx-auto"
          >
            Gerar Scripts Grátis <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'questionnaire') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Qual é seu nicho?</h2>
            <input
              type="text"
              placeholder="Ex: Marketing, Saúde, E-commerce..."
              className="w-full border-2 border-gray-300 rounded-lg p-4 mb-6"
              onChange={(e) => setUserData({ niche: e.target.value })}
            />
            <button
              onClick={handleGenerateScripts}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold"
            >
              Gerar Scripts
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <Loader className="text-purple-600 mx-auto mb-4 animate-spin" size={48} />
          <h2 className="text-3xl font-bold mb-4">Gerando seus scripts...</h2>
          <p className="text-gray-600">Analisando trends e criando conteúdo</p>
        </div>
      </div>
    );
  }

  if (step === 'scripts') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-2 text-center">Seus Scripts Gerados!</h2>
          <p className="text-gray-600 text-center mb-12">
            🚀 Baseados em vídeos que estão viralizando agora
          </p>

          <div className="space-y-8 mb-16">
            {scripts.length > 0 ? (
              scripts.map((script, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                    <h3 className="text-2xl font-bold">{script.titulo}</h3>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-purple-600 mb-2">🎯 GANCHO</h4>
                      <p className="text-gray-700">"{script.gancho}"</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-purple-600 mb-2">📝 DESENVOLVIMENTO</h4>
                      <p className="text-gray-700">{script.desenvolvimento}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-purple-600 mb-2">📢 CTA</h4>
                      <p className="text-gray-700">{script.cta}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-bold text-purple-600 mb-2">⏱️ DURAÇÃO</h4>
                        <p className="text-gray-700">{script.duracao}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-600 mb-2">📈 DIFICULDADE</h4>
                        <p className="text-gray-700">{script.dificuldade}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">
                <p className="text-gray-600">Nenhum script gerado</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('welcome')}
              className="bg-gray-500 text-white px-8 py-4 rounded-lg font-bold hover:bg-gray-600"
            >
              Gerar Novos Scripts
            </button>
          </div>
        </div>
      </div>
    );
  }
}