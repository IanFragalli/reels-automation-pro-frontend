import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { supabase } from './supabaseClient';

const INTERESTS = [
  'Marketing Digital', 'E-commerce', 'Beleza', 'Moda', 'Fitness',
  'Saúde', 'Educação', 'Culinária', 'Viagem', 'Tecnologia',
  'Games', 'Música', 'Lifestyle', 'Desenvolvimento Pessoal', 'Humor'
];

const GENDERS = [
  { value: 'masculino', label: '👨 Masculino' },
  { value: 'feminino', label: '👩 Feminino' },
  { value: 'neutro', label: '⚧️ Neutro' },
  { value: 'prefiro_nao_responder', label: '🤐 Prefiro não responder' }
];

export default function ProfileSetup({ user, darkMode, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    age: '',
    gender: '',
    city: '',
    bio: '',
    interests: []
  });

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const card = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const input = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  const handleInterestToggle = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSave = async () => {
    if (!form.gender || !form.city || form.interests.length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await supabase.from('user_profiles').insert([
        {
          user_id: user.id,
          age: form.age ? parseInt(form.age) : null,
          gender: form.gender,
          city: form.city,
          bio: form.bio,
          interests: form.interests
        }
      ]);
      onComplete();
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      alert('Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${bg} min-h-screen flex items-center justify-center p-4`}>
      <div className={`${card} rounded-3xl p-8 max-w-2xl w-full border border-gray-700 shadow-2xl`}>
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-700'}`} />
            ))}
          </div>
          <p className="text-gray-400 text-sm">Passo {step} de 3</p>
        </div>

        {/* Step 1: Básico */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-black mb-2">Bem-vindo ao ReelFlow! 👋</h2>
            <p className="text-gray-400 mb-8">Vamos conhecer você para personalizar seus scripts.</p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold mb-2">Idade (opcional)</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="25"
                  className={`w-full px-4 py-3 rounded-lg border ${input}`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Gênero *</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDERS.map(g => (
                    <button
                      key={g.value}
                      onClick={() => setForm(prev => ({ ...prev, gender: g.value }))}
                      className={`p-3 rounded-lg font-bold text-sm transition ${
                        form.gender === g.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              Próximo <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Localização */}
        {step === 2 && (
          <div>
            <h2 className="text-3xl font-black mb-2">Onde você fica? 📍</h2>
            <p className="text-gray-400 mb-8">Suas informações nos ajudam a gerar scripts mais relevantes.</p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold mb-2">Cidade *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="São Paulo, SP"
                  className={`w-full px-4 py-3 rounded-lg border ${input}`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Bio (opcional)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                  className={`w-full px-4 py-3 rounded-lg border ${input}`}
                  rows="3"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                Próximo <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Interesses */}
        {step === 3 && (
          <div>
            <h2 className="text-3xl font-black mb-2">Seus Interesses 🎯</h2>
            <p className="text-gray-400 mb-8">Selecione pelo menos 1 interesse para começar.</p>

            <div className="grid grid-cols-2 gap-2 mb-8">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 rounded-lg font-bold text-sm transition transform hover:scale-105 ${
                    form.interests.includes(interest)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? '⏳ Salvando...' : '✨ Começar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}