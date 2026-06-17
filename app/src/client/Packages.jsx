import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Check, X, Clock, Zap, Crown, Star, Gift, Shield, RefreshCw, Wallet, Package } from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-PT');
}

function isPromoActive(pack) {
  if (!pack.promoPrice || !pack.promoStartDate || !pack.promoEndDate) {
    return false;
  }
  const now = new Date();
  return new Date(pack.promoStartDate) <= now && now <= new Date(pack.promoEndDate);
}

function getPackageIcon(permissions) {
  if (!permissions) return <Zap className="h-6 w-6" />;
  const perms = permissions.toLowerCase();
  if (perms.includes('admin') || perms.includes('all')) return <Crown className="h-6 w-6" />;
  if (perms.includes('premium') || perms.includes('gold')) return <Star className="h-6 w-6" />;
  if (perms.includes('basic') || perms.includes('standard')) return <Shield className="h-6 w-6" />;
  return <Gift className="h-6 w-6" />;
}

function getPackageColor(permissions) {
  if (!permissions) return 'from-blue-500 to-indigo-600';
  const perms = permissions.toLowerCase();
  if (perms.includes('admin') || perms.includes('all')) return 'from-amber-500 to-rose-600';
  if (perms.includes('premium') || perms.includes('gold')) return 'from-purple-500 to-pink-600';
  if (perms.includes('basic') || perms.includes('standard')) return 'from-emerald-500 to-teal-600';
  return 'from-blue-500 to-indigo-600';
}

function Packages() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [packages, setPackages] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [walletTypes, setWalletTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState(null);
  const [renewingId, setRenewingId] = useState(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activePackage, setActivePackage] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentNumber, setPaymentNumber] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagesData, subsData, walletsData, walletTypesData] = await Promise.all([
        authRequest('/api/packages'),
        authRequest('/api/subscriptions'),
        authRequest('/api/wallets'),
        authRequest('/api/wallet-types')
      ]);
      setPackages(packagesData);
      setSubscriptions(subsData);
      setWallets(walletsData);
      setWalletTypes(walletTypesData);
      const defaultTypeCode = walletTypesData.find((type) =>
        type.code?.toLowerCase() === walletsData[0]?.WalletType?.code?.toLowerCase()
      )?.code?.toLowerCase() || walletTypesData[0]?.code?.toLowerCase() || walletsData[0]?.WalletType?.code?.toLowerCase() || '';
      setPaymentMethod(defaultTypeCode);
      const defaultWallet = walletsData.find(
        (wallet) => wallet.WalletType?.code?.toLowerCase() === defaultTypeCode
      );
      setSelectedWalletId(defaultWallet?.id || walletsData[0]?.id || '');
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: error.message || 'Não foi possível carregar os pacotes e subscrições.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (pack) => {
    if (!selectedWalletId) {
      notify({
        type: 'error',
        title: 'Selecione uma carteira',
        message: 'Escolha uma carteira para pagar a subscrição.'
      });
      return;
    }

    try {
      setSubscribingId(pack.id);
      await authRequest('/api/subscriptions/subscribe', {
        method: 'POST',
        body: {
          packageId: pack.id,
          walletId: selectedWalletId,
          autoRenew
        }
      });
      notify({
        type: 'success',
        title: 'Subscrição realizada',
        message: `Subscrito no pacote ${pack.name} com sucesso.`
      });
      await loadData();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao subscrever',
        message: error.message || 'Não foi possível subscrever ao pacote.'
      });
    } finally {
      setSubscribingId(null);
    }
  };

  const handleRenew = async (subscriptionId) => {
    if (!wallets.length) {
      notify({
        type: 'error',
        title: 'Renovação indisponível',
        message: 'Crie uma carteira antes de renovar a subscrição.'
      });
      return;
    }

    const walletToUse = wallets.find((wallet) => parseFloat(wallet.balance || 0) > 0) || wallets[0];
    if (!walletToUse) {
      notify({
        type: 'error',
        title: 'Nenhuma carteira disponível',
        message: 'Não foi possível encontrar uma carteira válida para renovar.'
      });
      return;
    }

    try {
      setRenewingId(subscriptionId);
      await authRequest('/api/subscriptions/renew', {
        method: 'POST',
        body: {
          id: subscriptionId,
          walletId: walletToUse.id
        }
      });
      notify({
        type: 'success',
        title: 'Renovação realizada',
        message: 'A subscrição foi renovada com sucesso.'
      });
      await loadData();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao renovar',
        message: error.message || 'Não foi possível renovar a subscrição.'
      });
    } finally {
      setRenewingId(null);
    }
  };

  const subscriptionByPackage = useMemo(() => {
    return subscriptions.reduce((map, sub) => {
      map[sub.packageId] = sub;
      return map;
    }, {});
  }, [subscriptions]);

  const paymentMethods = useMemo(() => {
    return walletTypes
      .filter((type) => type.status)
      .map((type) => ({
        code: String(type.code).toLowerCase(),
        label: type.name,
        provider: type.provider,
        typeId: type.id
      }));
  }, [walletTypes]);

  const getWalletForMethod = (methodCode) => {
    return wallets.find(
      (wallet) => wallet.WalletType?.code?.toLowerCase() === methodCode
    );
  };

  const getSubscriptionStatus = (pack) => {
    const sub = subscriptionByPackage[pack.id];
    if (!sub) return null;
    
    const isActive = sub?.status === 'active' && new Date(sub.expiresAt) > new Date();
    const isExpired = sub?.status === 'expired' || (sub?.status === 'active' && new Date(sub.expiresAt) <= new Date());
    
    return { sub, isActive, isExpired };
  };

  const renderPackageCard = (pack) => {
    const status = getSubscriptionStatus(pack);
    const promoActive = isPromoActive(pack);
    const price = promoActive ? pack.promoPrice : pack.price;
    const originalPrice = promoActive ? pack.price : null;
    const Icon = getPackageIcon(pack.permissionsGranted);
    const gradientColor = getPackageColor(pack.permissionsGranted);

    return (
      <div
        key={pack.id}
        className={`group relative min-w-[320px] flex-1 overflow-hidden rounded-3xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${
          status?.isActive
            ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-400 dark:bg-emerald-900/20'
            : status?.isExpired
              ? 'border-rose-300 bg-rose-50/50 dark:border-rose-400 dark:bg-rose-900/20'
              : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${gradientColor}`}></div>

        {status?.isActive && (
          <div className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
            Ativo
          </div>
        )}
        {status?.isExpired && (
          <div className="absolute right-4 top-4 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
            Expirado
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientColor} text-white shadow-lg`}>
              {Icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{pack.name}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{pack.description}</p>
              {pack.features && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {pack.features.split(',').slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <Check className="h-3 w-3 text-emerald-500" />
                      {feature.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-right">
              {promoActive && originalPrice && (
                <p className="text-sm text-slate-400 line-through dark:text-slate-500">
                  {parseFloat(originalPrice).toFixed(2)} MZN
                </p>
              )}
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {parseFloat(price).toFixed(2)} <span className="text-base font-normal text-slate-500">MZN</span>
              </p>
              {promoActive && (
                <div className="mt-1 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                  <Gift className="h-3 w-3" />
                  Promoção
                </div>
              )}
            </div>
            {pack.duration && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {pack.duration} dias
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {pack.permissionsGranted && (
            <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Permissões concedidas</p>
              </div>
              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">{pack.permissionsGranted}</p>
            </div>
          )}
          {pack.permissionsDenied && (
            <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-900/20">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Permissões negadas</p>
              </div>
              <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{pack.permissionsDenied}</p>
            </div>
          )}
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</p>
                <p className={`text-sm font-semibold ${
                  status.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {status.isActive ? 'Ativo' : 'Expirado'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Iniciada em</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{formatDate(status.sub.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Expira em</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{formatDate(status.sub.expiresAt)}</p>
              </div>
            </div>
            {status.sub.autoRenew && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <RefreshCw className="h-3 w-3" />
                Renovação automática ativa
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          {status?.isActive ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-700 cursor-not-allowed dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              <Check className="mr-2 h-4 w-4" />
              Já subscrito
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openSubscribeModal(pack)}
              disabled={subscribingId === pack.id || !wallets.length}
              className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 ${
                subscribingId === pack.id
                  ? 'bg-slate-400 cursor-not-allowed'
                  : !wallets.length
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 hover:shadow-lg transform hover:scale-[1.02]'
              }`}
            >
              {subscribingId === pack.id ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  A subscrever...
                </>
              ) : status?.isExpired ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renovar pacote
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Subscrever agora
                </>
              )}
            </button>
          )}
          {!wallets.length && (
            <p className="mt-2 flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400">
              <Wallet className="h-4 w-4" />
              Crie uma carteira antes de subscrever
            </p>
          )}
        </div>
      </div>
    );
  };

  const openSubscribeModal = (pack) => {
    setActivePackage(pack);
    setModalStep(1);
    const defaultMethod = walletTypes[0]?.code?.toLowerCase() || wallets[0]?.WalletType?.code?.toLowerCase() || '';
    setPaymentMethod(defaultMethod);
    const defaultWallet = wallets.find(
      (wallet) => wallet.WalletType?.code?.toLowerCase() === defaultMethod
    );
    setSelectedWalletId(defaultWallet?.id || wallets[0]?.id || '');
    setPaymentNumber('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setActivePackage(null);
    setModalStep(1);
  };

  const handleConfirmSubscription = async () => {
    if (!activePackage) return;
    const selectedWallet = getWalletForMethod(paymentMethod);
    if (!selectedWallet) {
      notify({
        type: 'error',
        title: 'Nenhuma carteira disponível',
        message: 'Não existe uma carteira válida para o método selecionado.'
      });
      return;
    }
    if (!paymentNumber.trim()) {
      notify({
        type: 'error',
        title: 'Número inválido',
        message: 'Insira o número de pagamento para continuar.'
      });
      return;
    }

    try {
      setSubscribingId(activePackage.id);
      await authRequest('/api/subscriptions/subscribe', {
        method: 'POST',
        body: {
          packageId: activePackage.id,
          walletId: selectedWallet.id,
          autoRenew,
          paymentMethod,
          paymentNumber
        }
      });
      notify({
        type: 'success',
        title: 'Subscrição realizada',
        message: `Subscrito no pacote ${activePackage.name} com sucesso.`
      });
      closeModal();
      await loadData();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao subscrever',
        message: error.message || 'Não foi possível subscrever ao pacote.'
      });
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Cliente</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Pacotes e Subscrições</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja os pacotes disponíveis e subscreva ao que melhor atende às suas necessidades.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[320px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Escolha um pacote</h2>
          
          {loading ? (
            <div className="mt-4 grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div className="h-4 w-48 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div className="h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    </div>
                    <div className="h-10 w-24 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <Package className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
              <p className="mt-3 text-lg font-medium">Não existem pacotes disponíveis</p>
              <p className="text-sm">Volte mais tarde para ver as novidades</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-4">
              {packages.map(renderPackageCard)}
            </div>
          )}
        </div>
      </div>
      {showModal && activePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold">Subscrição: {activePackage.name}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Complete os passos abaixo para pagar a sua subscrição.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {modalStep === 1 ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${getPackageColor(activePackage.permissionsGranted)} text-white`}>
                        {getPackageIcon(activePackage.permissionsGranted)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Pacote</p>
                        <h4 className="text-xl font-semibold text-slate-900 dark:text-white">{activePackage.name}</h4>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{activePackage.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">Preço: {parseFloat(isPromoActive(activePackage) ? activePackage.promoPrice : activePackage.price).toFixed(2)} MZN</span>
                      {activePackage.duration && <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">Duração: {activePackage.duration} dias</span>}
                      {activePackage.permissionsGranted && <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">Permissões: {activePackage.permissionsGranted}</span>}
                    </div>
                    {activePackage.features && (
                      <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <p className="font-semibold">Funcionalidades incluídas:</p>
                        <ul className="list-disc pl-5">
                          {activePackage.features.split(',').map((feature, index) => (
                            <li key={index}>{feature.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Resumo da subscrição</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Pacote</p>
                        <p className="mt-2 font-semibold text-slate-900 dark:text-white">{activePackage.name}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Valor</p>
                        <p className="mt-2 font-semibold text-slate-900 dark:text-white">{parseFloat(isPromoActive(activePackage) ? activePackage.promoPrice : activePackage.price).toFixed(2)} MZN</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Método de pagamento</p>
                    <div className="space-y-4">
                      {paymentMethods.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Métodos de pagamento</p>
                          <div className="space-y-3">
                            {paymentMethods.map((method) => (
                              <label
                                key={method.code}
                                className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={method.code}
                                    checked={paymentMethod === method.code}
                                    onChange={(event) => {
                                      const methodSelected = event.target.value;
                                      setPaymentMethod(methodSelected);
                                      const walletForMethod = getWalletForMethod(methodSelected);
                                      if (walletForMethod) {
                                        setSelectedWalletId(walletForMethod.id);
                                      }
                                    }}
                                    className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{method.label}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{method.provider || 'Método disponível'}</p>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
                          Nenhuma carteira disponível para determinar métodos de pagamento. Crie uma carteira primeiro.
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Número de pagamento</label>
                        <input
                          type="text"
                          value={paymentNumber}
                          onChange={(event) => setPaymentNumber(event.target.value)}
                          placeholder="Insira o número de telefone ou referência"
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Simulação de pagamento</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">Este fluxo simula o pagamento de subscrição com os dados fornecidos.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  if (modalStep > 1) {
                    setModalStep(modalStep - 1);
                  } else {
                    closeModal();
                  }
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {modalStep > 1 ? 'Voltar' : 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={modalStep === 1 ? () => setModalStep(2) : handleConfirmSubscription}
                disabled={modalStep === 2 && (!paymentNumber.trim() || !selectedWalletId)}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {modalStep === 1 ? 'Próximo' : subscribingId === activePackage.id ? 'A processar...' : 'Pagar agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de subscrições */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">As suas subscrições</h2>
        {subscriptions.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <Package className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
            <p className="mt-3 font-medium">Ainda não tem subscrições</p>
            <p className="text-sm">Subscreva a um pacote para começar</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {subscriptions.map((sub) => {
              const isActive = sub.status === 'active' && new Date(sub.expiresAt) > new Date();
              return (
                <div 
                  key={sub.id} 
                  className={`rounded-2xl border p-4 transition hover:shadow-md ${
                    isActive 
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/20' 
                      : 'border-rose-200 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {sub.Package?.name || 'Pacote'}
                      </h4>
                      <div className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-300">
                        <p>Início: {formatDate(sub.startedAt)}</p>
                        <p>Expira: {formatDate(sub.expiresAt)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      isActive 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'
                    }`}>
                      {isActive ? (
                        <>
                          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                          Ativo
                        </>
                      ) : (
                        <>
                          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-500"></span>
                          Expirado
                        </>
                      )}
                    </span>
                  </div>
                  {sub.autoRenew && isActive && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <RefreshCw className="h-3 w-3" />
                      Renovação automática ativa
                    </div>
                  )}
                  {!isActive && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleRenew(sub.id)}
                        disabled={renewingId === sub.id || !wallets.length}
                        className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition duration-200 ${
                          renewingId === sub.id || !wallets.length
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800'
                        }`}
                      >
                        {renewingId === sub.id ? 'A renovar...' : 'Renovar subscrição'}
                      </button>
                      {!wallets.length && (
                        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">Crie uma carteira para renovar a subscrição.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Packages;