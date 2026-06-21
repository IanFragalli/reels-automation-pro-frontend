import { Check, X, Zap, Crown, Infinity } from 'lucide-react';

export default function Pricing({ onSelectPlan, darkMode, onNavigate }) {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      emoji: '🟢',
      price: 'R$ 0',
      period: 'Para sempre',
      description: 'Perfeito para começar',
      icon: Zap,
      cta: 'Começar Agora',
      gradient: 'from-gray-500 to-gray-600',
      highlight: false,
      features: [
        { name: '5 scripts/mês', included: true },
        { name: 'Histórico de scripts', included: true },
        { name: 'Favoritos', included: true },
        { name: 'Dark mode', included: true },
        { name: 'Download em PDF', included: false },
        { name: 'Analytics avançado', included: false },
        { name: 'Agendamento automático', included: false },
        { name: 'API pública', included: false },
        { name: 'Suporte prioritário', included: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      emoji: '🔵',
      price: 'R$ 39',
      period: '/mês',
      description: 'Para criadores profissionais',
      icon: Crown,
      cta: 'Upgrade para Pro',
      gradient: 'from-blue-500 to-blue-600',
      highlight: true,
      features: [
        { name: '50 scripts/mês', included: true },
        { name: 'Histórico de scripts', included: true },
        { name: 'Favoritos', included: true },
        { name: 'Dark mode', included: true },
        { name: 'Download em PDF', included: true },
        { name: 'Analytics avançado', included: true },
        { name: 'Agendamento automático', included: false },
        { name: 'API pública', included: false },
        { name: 'Suporte prioritário', included: false },
      ]
    },
    {
      id: 'business',
      name: 'Business',
      emoji: '🟣',
      price: 'R$ 149',
      period: '/mês',
      description: 'Solução empresarial completa',
      icon: Infinity,
      cta: 'Upgrade para Business',
      gradient: 'from-purple-500 to-purple-600',
      highlight: false,
      features: [
        { name: 'Scripts ilimitados', included: true },
        { name: 'Histórico de scripts', included: true },
        { name: 'Favoritos', included: true },
        { name: 'Dark mode', included: true },
        { name: 'Download em PDF', included: true },
        { name: 'Analytics avançado', included: true },
        { name: 'Agendamento automático', included: true },
        { name: 'API pública', included: true },
        { name: 'Suporte prioritário', included: true },
      ]
    }
  ];

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const card = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const border = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`${bg} ${text} min-h-screen transition-colors`}>
      {/* HEADER */}
      <header className={`border-b ${border} sticky top-0 z-40 backdrop-blur-md ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎬 Reels AI Pro</h1>
          <button
            onClick={() => onNavigate('scripts')}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
          >
            ← Voltar ao App
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="mb-6 inline-block">
          <span className="px-4 py-2 rounded-full bg-blue-500 bg-opacity-20 text-blue-400 text-sm font-bold uppercase tracking-wider">
            ⚡ Simples. Transparente. Justo.
          </span>
        </div>

        <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
          Escolha seu <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Plano Perfeito</span>
        </h2>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Gere scripts virais com IA em segundos. Sem ocultos, sem surpresas. Cancele quando quiser.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <span className="text-gray-400">📅 Faturamento mensal</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" disabled />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-gray-400">💰 Anual (em breve!)</span>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            return (
              <div
                key={idx}
                className={`relative rounded-2xl border transition-all duration-300 ${
                  plan.highlight
                    ? `border-blue-500 shadow-2xl shadow-blue-500/20 scale-105 ${card}`
                    : `border-gray-700 hover:border-gray-600 ${card}`
                }`}
              >
                {/* BADGE DESTAQUE */}
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-full uppercase">
                      ⭐ Mais Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* HEADER */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">{plan.emoji}</span>
                    <div>
                      <h3 className="text-2xl font-black">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  {/* PREÇO */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold">{plan.period}</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {plan.id === 'free' ? 'Sem cartão de crédito' : 'Cancele a qualquer momento'}
                    </p>
                  </div>

                  {/* CTA BUTTON */}
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full font-bold py-3 px-4 rounded-xl mb-8 transition-all duration-300 flex items-center justify-center gap-2 ${
                      plan.highlight
                        ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg hover:shadow-blue-500/50 scale-100 hover:scale-105`
                        : `border border-gray-700 text-white hover:border-gray-600 hover:bg-gray-700/50`
                    }`}
                  >
                    {plan.id === 'free' ? '✨ Começar' : '🚀 ' + plan.cta}
                  </button>

                  {/* FEATURES */}
                  <div className="space-y-3 border-t border-gray-700 pt-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="text-green-500 flex-shrink-0" size={20} />
                        ) : (
                          <X className="text-gray-600 flex-shrink-0" size={20} />
                        )}
                        <span className={feature.included ? 'text-gray-200' : 'text-gray-500'}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-black mb-2">❓ Perguntas Frequentes</h3>
          <p className="text-gray-400">Tudo que você precisa saber</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Posso trocar de plano depois?',
              a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As mudanças entram em vigor no próximo ciclo de faturamento.'
            },
            {
              q: 'Como funciona o cancelamento?',
              a: 'Cancele em um clique nas configurações. Você mantém o acesso até o final do período pago.'
            },
            {
              q: 'Preciso de cartão de crédito para o Free?',
              a: 'Não! O plano Free é totalmente gratuito. Sem cartão, sem limite de tempo.'
            },
            {
              q: 'Vocês oferecem reembolso?',
              a: 'Oferecemos 7 dias de garantia. Se não gostar, devolvemos 100% do seu dinheiro.'
            },
            {
              q: 'O que é a API pública?',
              a: 'A API permite integrar a geração de scripts diretamente em sua aplicação ou site.'
            },
            {
              q: 'Tem suporte ao cliente?',
              a: 'Sim! Planos Pro e Business têm suporte prioritário por email. Free tem acesso a documentação.'
            }
          ].map((item, idx) => (
            <div key={idx} className={`${card} rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition`}>
              <h4 className="font-bold text-lg mb-2">{item.q}</h4>
              <p className="text-gray-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} py-16 border-t border-gray-700`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-black mb-4">Pronto para criar scripts virais?</h3>
          <p className="text-gray-400 mb-8">Escolha seu plano e comece em segundos. Sem configuração complicada.</p>
          <button
            onClick={() => onSelectPlan('pro')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition"
          >
            Comece com Pro →
          </button>
        </div>
      </section>
    </div>
  );
}