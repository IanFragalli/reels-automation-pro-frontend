import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Lock, Unlock, Eye, EyeOff, LogOut, Users, Package, Tag, TrendingUp } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function Admin({ user, darkMode, onLogout }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Forms
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '' });
  const [campaignForm, setCampaignForm] = useState({ name: '', description: '', start_date: '', end_date: '', discount_percentage: '' });
  const [discountForm, setDiscountForm] = useState({ code: '', percentage: '', max_uses: '', start_date: '', end_date: '' });
  const [editingId, setEditingId] = useState(null);

  const [showPassword, setShowPassword] = useState(false);

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const card = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const input = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Carregar produtos
      const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(productsData || []);

      // Carregar campanhas
      const { data: campaignsData } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      setCampaigns(campaignsData || []);

      // Carregar descontos
      const { data: discountsData } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
      setDiscounts(discountsData || []);

      // Carregar usuários
      const { data: usersData } = await supabase.from('user_subscriptions').select('user_id, plan, scripts_used').order('created_at', { ascending: false });
      setAllUsers(usersData || []);

      // Carregar usuários banidos
      const { data: bannedData } = await supabase.from('user_bans').select('*').order('banned_at', { ascending: false });
      setBannedUsers(bannedData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setMessage('❌ Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // PRODUTOS
  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.price) {
      setMessage('❌ Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('products').update(productForm).eq('id', editingId);
        setMessage('✅ Produto atualizado!');
        setEditingId(null);
      } else {
        await supabase.from('products').insert([productForm]);
        setMessage('✅ Produto criado!');
      }
      setProductForm({ name: '', description: '', price: '', category: '' });
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      setMessage('✅ Produto deletado!');
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setProductForm(product);
    setEditingId(product.id);
  };

  // CAMPANHAS
  const handleAddCampaign = async () => {
    if (!campaignForm.name || !campaignForm.start_date || !campaignForm.end_date) {
      setMessage('❌ Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('campaigns').update(campaignForm).eq('id', editingId);
        setMessage('✅ Campanha atualizada!');
        setEditingId(null);
      } else {
        await supabase.from('campaigns').insert([campaignForm]);
        setMessage('✅ Campanha criada!');
      }
      setCampaignForm({ name: '', description: '', start_date: '', end_date: '', discount_percentage: '' });
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await supabase.from('campaigns').delete().eq('id', id);
      setMessage('✅ Campanha deletada!');
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  const handleEditCampaign = (campaign) => {
    setCampaignForm(campaign);
    setEditingId(campaign.id);
  };

  // DESCONTOS
  const handleAddDiscount = async () => {
    if (!discountForm.code || !discountForm.percentage || !discountForm.start_date || !discountForm.end_date) {
      setMessage('❌ Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('discounts').update(discountForm).eq('id', editingId);
        setMessage('✅ Desconto atualizado!');
        setEditingId(null);
      } else {
        await supabase.from('discounts').insert([discountForm]);
        setMessage('✅ Desconto criado!');
      }
      setDiscountForm({ code: '', percentage: '', max_uses: '', start_date: '', end_date: '' });
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await supabase.from('discounts').delete().eq('id', id);
      setMessage('✅ Desconto deletado!');
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  const handleEditDiscount = (discount) => {
    setDiscountForm(discount);
    setEditingId(discount.id);
  };

  // USUÁRIOS
  const handleBanUser = async (userId, reason) => {
    const reasonText = prompt('Digite o motivo do bloqueio:');
    if (!reasonText) return;

    try {
      await supabase.from('user_bans').insert([{
        user_id: userId,
        reason: reasonText,
        banned_by: user.email
      }]);
      setMessage('✅ Usuário bloqueado!');
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await supabase.from('user_bans').delete().eq('user_id', userId);
      setMessage('✅ Usuário desbloqueado!');
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('⚠️ Isso vai deletar TODAS as contas desse usuário! Tem certeza?')) return;

    try {
      // Deletar scripts
      await supabase.from('scripts').delete().eq('user_id', userId);
      // Deletar subscrição
      await supabase.from('user_subscriptions').delete().eq('user_id', userId);
      // Deletar usuário
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      setMessage('✅ Usuário deletado!');
      await loadAllData();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  return (
    <div className={`${bg} ${text} min-h-screen`}>
      {/* HEADER */}
      <header className={`${card} border-b border-gray-700 sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">👑 Admin Master</h1>
            <p className="text-gray-400 text-sm">Controle total do aplicativo</p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition flex items-center gap-2"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TABS */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: '📊 Dashboard', icon: TrendingUp },
            { id: 'products', label: '📦 Produtos', icon: Package },
            { id: 'campaigns', label: '📢 Campanhas', icon: TrendingUp },
            { id: 'discounts', label: '🏷️ Descontos', icon: Tag },
            { id: 'users', label: '👥 Usuários', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition ${
                currentTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : `${card} border border-gray-700 hover:border-gray-600`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-500 bg-opacity-20 border border-green-500 text-green-400' : 'bg-red-500 bg-opacity-20 border border-red-500 text-red-400'}`}>
            <p>{message}</p>
          </div>
        )}

        {/* DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`${card} rounded-xl p-6 border border-gray-700`}>
              <p className="text-gray-400 text-sm uppercase font-bold mb-2">Total de Usuários</p>
              <p className="text-4xl font-bold">{allUsers.length}</p>
            </div>
            <div className={`${card} rounded-xl p-6 border border-gray-700`}>
              <p className="text-gray-400 text-sm uppercase font-bold mb-2">Produtos</p>
              <p className="text-4xl font-bold">{products.length}</p>
            </div>
            <div className={`${card} rounded-xl p-6 border border-gray-700`}>
              <p className="text-gray-400 text-sm uppercase font-bold mb-2">Campanhas Ativas</p>
              <p className="text-4xl font-bold">{campaigns.filter(c => c.active).length}</p>
            </div>
            <div className={`${card} rounded-xl p-6 border border-gray-700`}>
              <p className="text-gray-400 text-sm uppercase font-bold mb-2">Usuários Bloqueados</p>
              <p className="text-4xl font-bold text-red-500">{bannedUsers.length}</p>
            </div>
          </div>
        )}

        {/* PRODUTOS */}
        {currentTab === 'products' && (
          <>
            <div className={`${card} rounded-xl p-8 border border-gray-700 mb-8`}>
              <h2 className="text-2xl font-bold mb-6">{editingId ? '✏️ Editar Produto' : '➕ Novo Produto'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Nome do produto"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Categoria"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="Preço (R$)"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Descrição"
                  className={`px-4 py-3 rounded-lg border ${input} col-span-2`}
                  rows="2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddProduct}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {editingId ? '💾 Atualizar' : '➕ Criar'}
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setProductForm({ name: '', description: '', price: '', category: '' });
                    }}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
                  >
                    ❌ Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {products.map(product => (
                <div key={product.id} className={`${card} rounded-lg p-6 border border-gray-700 flex items-center justify-between`}>
                  <div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-gray-400 text-sm">{product.category}</p>
                    <p className="text-blue-400 font-bold">R$ {parseFloat(product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CAMPANHAS */}
        {currentTab === 'campaigns' && (
          <>
            <div className={`${card} rounded-xl p-8 border border-gray-700 mb-8`}>
              <h2 className="text-2xl font-bold mb-6">{editingId ? '✏️ Editar Campanha' : '➕ Nova Campanha'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Nome da campanha"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="number"
                  value={campaignForm.discount_percentage}
                  onChange={(e) => setCampaignForm({ ...campaignForm, discount_percentage: e.target.value })}
                  placeholder="Desconto (%)"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Descrição"
                  className={`px-4 py-3 rounded-lg border ${input} col-span-2`}
                  rows="2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddCampaign}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {editingId ? '💾 Atualizar' : '➕ Criar'}
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setCampaignForm({ name: '', description: '', start_date: '', end_date: '', discount_percentage: '' });
                    }}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
                  >
                    ❌ Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {campaigns.map(campaign => (
                <div key={campaign.id} className={`${card} rounded-lg p-6 border border-gray-700 flex items-center justify-between`}>
                  <div>
                    <h3 className="font-bold text-lg">{campaign.name}</h3>
                    <p className="text-gray-400 text-sm">{campaign.start_date} até {campaign.end_date}</p>
                    <p className="text-green-400 font-bold">{campaign.discount_percentage}% de desconto</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded text-sm font-bold ${campaign.active ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-gray-500 bg-opacity-20 text-gray-400'}`}>
                      {campaign.active ? '✅ Ativa' : '❌ Inativa'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCampaign(campaign)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DESCONTOS */}
        {currentTab === 'discounts' && (
          <>
            <div className={`${card} rounded-xl p-8 border border-gray-700 mb-8`}>
              <h2 className="text-2xl font-bold mb-6">{editingId ? '✏️ Editar Desconto' : '➕ Novo Desconto'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  placeholder="Código (ex: BLACKFRIDAY)"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="number"
                  value={discountForm.percentage}
                  onChange={(e) => setDiscountForm({ ...discountForm, percentage: e.target.value })}
                  placeholder="Desconto (%)"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="number"
                  value={discountForm.max_uses}
                  onChange={(e) => setDiscountForm({ ...discountForm, max_uses: e.target.value })}
                  placeholder="Máximo de usos (0 = ilimitado)"
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="date"
                  value={discountForm.start_date}
                  onChange={(e) => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
                <input
                  type="date"
                  value={discountForm.end_date}
                  onChange={(e) => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                  className={`px-4 py-3 rounded-lg border ${input}`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddDiscount}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {editingId ? '💾 Atualizar' : '➕ Criar'}
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setDiscountForm({ code: '', percentage: '', max_uses: '', start_date: '', end_date: '' });
                    }}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
                  >
                    ❌ Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {discounts.map(discount => (
                <div key={discount.id} className={`${card} rounded-lg p-6 border border-gray-700 flex items-center justify-between`}>
                  <div>
                    <h3 className="font-bold text-lg font-mono text-blue-400">{discount.code}</h3>
                    <p className="text-gray-400 text-sm">{discount.start_date} até {discount.end_date}</p>
                    <p className="text-green-400 font-bold">{discount.percentage}% OFF</p>
                    <p className="text-xs text-gray-500 mt-1">Usos: {discount.used}/{discount.max_uses || '∞'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDiscount(discount)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* USUÁRIOS */}
        {currentTab === 'users' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Usuários ativos */}
              <div>
                <h3 className="text-xl font-bold mb-4">✅ Usuários Ativos ({allUsers.length})</h3>
                <div className="space-y-3">
                  {allUsers.map(user => (
                    <div key={user.user_id} className={`${card} rounded-lg p-4 border border-gray-700`}>
                      <p className="font-bold text-sm break-all">{user.user_id}</p>
                      <p className="text-gray-400 text-xs">Plano: <span className="font-bold text-blue-400">{user.plan.toUpperCase()}</span></p>
                      <p className="text-gray-400 text-xs">Scripts: {user.scripts_used}</p>
                      <button
                        onClick={() => handleBanUser(user.user_id)}
                        className="mt-2 w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition"
                      >
                        🔒 Bloquear Usuário
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usuários banidos */}
              <div>
                <h3 className="text-xl font-bold mb-4">🚫 Usuários Bloqueados ({bannedUsers.length})</h3>
                <div className="space-y-3">
                  {bannedUsers.map(ban => (
                    <div key={ban.id} className={`${card} rounded-lg p-4 border border-red-700 bg-red-500 bg-opacity-5`}>
                      <p className="font-bold text-sm break-all text-red-400">{ban.user_id}</p>
                      <p className="text-gray-400 text-xs">Motivo: {ban.reason}</p>
                      <p className="text-gray-400 text-xs">Bloqueado por: {ban.banned_by}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleUnbanUser(ban.user_id)}
                          className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded transition"
                        >
                          🔓 Desbloquear
                        </button>
                        <button
                          onClick={() => handleDeleteUser(ban.user_id)}
                          className="flex-1 px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded transition"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}