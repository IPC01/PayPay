import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { isPromoActive } from '../../helpers/packagePricing';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';
import {
  Check, X, Clock, Zap, Crown, Star, Gift, Shield, RefreshCw, Wallet, Package
} from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('pt-PT');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2
  });
}

function getPackageIcon(permissions) {
  if (!permissions) return <Zap className="h-5 w-5" />;
  const perms = permissions.toLowerCase();
  if (perms.includes('admin') || perms.includes('all')) return <Crown className="h-5 w-5" />;
  if (perms.includes('premium') || perms.includes('gold')) return <Star className="h-5 w-5" />;
  if (perms.includes('basic') || perms.includes('standard')) return <Shield className="h-5 w-5" />;
  return <Gift className="h-5 w-5" />;
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
  const [walletTypes, setWalletTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [activePackage, setActivePackage] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [subscriptionStep, setSubscriptionStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const subscriptionHeadingRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activePackage) subscriptionHeadingRef.current?.focus();
  }, [activePackage]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [packagesData, subsData, walletTypesData] = await Promise.all([
        authRequest('/api/packages'),
        authRequest('/api/subscriptions'),
        authRequest('/api/wallet-types')
      ]);
      setPackages(packagesData);
      setSubscriptions(subsData);
      setWalletTypes(walletTypesData);
    } catch (error) {
      if (!silent) {
        notify({
          type: 'error',
          title: 'Erro ao carregar dados',
          message: error.message || 'Não foi possível carregar os pacotes e subscrições.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // O fluxo de subscrição (passos, método e número de pagamento) preserva-se.
  useAutoRefresh(() => loadData(true));

  const paymentMethods = useMemo(() => {
    return walletTypes
      .filter((type) => type.status && String(type.code).toLowerCase() === 'mpesa')
      .map((type) => ({
        code: String(type.code).toLowerCase(),
        label: type.name,
        provider: type.provider,
        typeId: type.id
      }));
  }, [walletTypes]);

  const subscriptionByPackage = useMemo(() => {
    return subscriptions.reduce((map, sub) => {
      map[sub.packageId] = sub;
      return map;
    }, {});
  }, [subscriptions]);

  const getSubscriptionStatus = (pack) => {
    const sub = subscriptionByPackage[pack.id];
    if (!sub) return null;
    const isActive = sub?.status === 'active' && new Date(sub.expiresAt) > new Date();
    const isExpired =
      sub?.status === 'expired' ||
      (sub?.status === 'active' && new Date(sub.expiresAt) <= new Date());
    return { sub, isActive, isExpired };
  };

  const openSubscription = (pack) => {
    setActivePackage(pack);
    setRenewTarget(null);
    setSubscriptionStep(1);
    setPaymentMethod(paymentMethods[0]?.code || '');
    setPaymentNumber('');
    setAutoRenew(true);
  };

  const handleRenew = (sub) => {
    setRenewTarget(sub);
    setActivePackage(sub.Package || packages.find((pack) => pack.id === sub.packageId) || null);
    setSubscriptionStep(2);
    setPaymentMethod(paymentMethods[0]?.code || '');
    setPaymentNumber('');
  };

  const closeSubscription = () => {
    setActivePackage(null);
    setRenewTarget(null);
    setSubscriptionStep(1);
    setPaymentNumber('');
  };

  const handleConfirmSubscription = async () => {
    if (!activePackage || subscribingId !== null) return;
    if (!activePackage.isFree) {
      if (!paymentMethod) {
        notify({
          type: 'error',
          title: 'Método de pagamento requerido',
          message: 'Selecione um método de pagamento para continuar.'
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
    }

    try {
      setSubscribingId(renewTarget ? renewTarget.id : activePackage.id);
      const paymentFields = activePackage.isFree ? {} : { paymentMethod, paymentNumber };

      if (renewTarget) {
        await authRequest('/api/subscriptions/renew', {
          method: 'POST',
          body: { id: renewTarget.id, ...paymentFields }
        });
        notify({
          type: 'success',
          title: 'Renovação realizada',
          message: 'A subscrição foi renovada com sucesso.'
        });
      } else {
        await authRequest('/api/subscriptions/subscribe', {
          method: 'POST',
          body: { packageId: activePackage.id, autoRenew, ...paymentFields }
        });
        notify({
          type: 'success',
          title: activePackage.isFree ? 'Pacote ativado' : 'Subscrição realizada',
          message: activePackage.isFree
            ? `O pacote ${activePackage.name} foi ativado com sucesso.`
            : `Subscrito no pacote ${activePackage.name} com sucesso.`
        });
      }
      closeSubscription();
      await loadData();
    } catch (error) {
      notify({
        type: 'error',
        title: renewTarget ? 'Erro ao renovar' : 'Erro ao subscrever',
        message: error.message || 'Não foi possível processar o pagamento.'
      });
    } finally {
      setSubscribingId(null);
    }
  };

  // ── Card de pacote ────────────────────────────────────────────────────────
  const PackageCard = ({ pack }) => {
    const status = getSubscriptionStatus(pack);
    const promoActive = isPromoActive(pack);
    const price = promoActive ? pack.promoPrice : pack.price;
    const originalPrice = promoActive ? pack.price : null;
    const Icon = getPackageIcon(pack.permissionsGranted);
    const gradientColor = getPackageColor(pack.permissionsGranted);
    const notConfigured = !pack.isFree && !paymentMethods.length;

    return (
      <div
        className={`relative flex flex-col overflow-hidden rounded-2xl border-2 p-5 transition-shadow hover:shadow-lg ${
          status?.isActive
            ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-400 dark:bg-emerald-900/20'
            : status?.isExpired
              ? 'border-rose-300 bg-rose-50/50 dark:border-rose-400 dark:bg-rose-900/20'
              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
        }`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradientColor}`} />

        {/* Estado */}
        {status?.isActive && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
            Ativo
          </span>
        )}
        {status?.isExpired && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
            Expirado
          </span>
        )}

        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradientColor} text-white shadow-sm`}
          >
            {Icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
              {pack.name}
            </h3>
            {pack.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                {pack.description}
              </p>
            )}
          </div>
        </div>

        {/* Preço */}
        <div className="mt-3">
          {promoActive && originalPrice && (
            <p className="text-[11px] text-slate-400 line-through dark:text-slate-500">
              {formatCurrency(originalPrice)}
            </p>
          )}
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(price)}
            </p>
            {promoActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                <Gift className="h-3 w-3" />
                Promoção
              </span>
            )}
          </div>
          {pack.duration && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {pack.duration} dias
            </p>
          )}
        </div>

        {/* Permissões resumidas */}
        {(pack.permissionsGranted || pack.permissionsDenied) && (
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            {pack.permissionsGranted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Check className="h-3 w-3" />
                {pack.permissionsGranted.split(',')[0]}
                {pack.permissionsGranted.split(',').length > 1 ? ' +' : ''}
              </span>
            )}
            {pack.permissionsDenied && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                <X className="h-3 w-3" />
                {pack.permissionsDenied.split(',')[0]}
                {pack.permissionsDenied.split(',').length > 1 ? ' +' : ''}
              </span>
            )}
          </div>
        )}

        {/* Assinatura existente */}
        {status && (
          <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-[11px] text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Início: <strong>{formatDate(status.sub.startedAt)}</strong>
              </span>
              <span>
                Expira: <strong>{formatDate(status.sub.expiresAt)}</strong>
              </span>
              {status.sub.autoRenew && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <RefreshCw className="h-3 w-3" />
                  Auto
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4">
          {status?.isActive ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              <Check className="mr-2 h-4 w-4" />
              Já subscrito
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openSubscription(pack)}
              disabled={subscribingId === pack.id || notConfigured}
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                notConfigured
                  ? 'bg-slate-400'
                  : 'bg-brand-600 hover:bg-brand-700'
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
                  {pack.isFree ? 'Reativar pacote' : 'Renovar pacote'}
                </>
              ) : pack.isFree ? (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Ativar pacote
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Subscrever agora
                </>
              )}
            </button>
          )}
          {notConfigured && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400">
              <Wallet className="h-3 w-3" />
              Sem métodos de pagamento configurados
            </p>
          )}
        </div>
      </div>
    );
  };

  // ── Fluxo de subscrição ──────────────────────────────────────────────────
  const activePrice = activePackage
    ? isPromoActive(activePackage)
      ? activePackage.promoPrice
      : activePackage.price
    : 0;

  const confirmDisabled =
    subscribingId !== null ||
    (subscriptionStep === 2 &&
      !activePackage?.isFree &&
      (!paymentNumber.trim() || !paymentMethod));

  if (activePackage) {
    return (
      <div className="space-y-4">
        {/* Barra de contexto */}
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {renewTarget ? 'Renovação' : 'Subscrição'}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {activePackage.name}
            </p>
          </div>
          <button
            type="button"
            onClick={closeSubscription}
            disabled={subscribingId !== null}
            className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Voltar aos pacotes
          </button>
        </div>

        <section
          aria-labelledby="subscription-heading"
          className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <h2
            id="subscription-heading"
            ref={subscriptionHeadingRef}
            tabIndex={-1}
            className="text-base font-bold text-slate-900 dark:text-white sm:text-lg"
          >
            {renewTarget ? 'Renovação' : 'Subscrição'}: {activePackage.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Complete os passos abaixo para pagar diretamente na API de pagamentos.
          </p>

          {/* Indicador de passos */}
          <div className="mt-4 flex items-center gap-2 text-[11px]">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    subscriptionStep >= step
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {step}
                </span>
                <span
                  className={
                    subscriptionStep >= step
                      ? 'font-semibold text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                >
                  {step === 1 ? 'Resumo' : 'Pagamento'}
                </span>
                {step === 1 && <span className="mx-1 h-px w-6 bg-slate-200 dark:bg-slate-700" />}
              </div>
            ))}
          </div>

          {/* Passo 1: resumo */}
          {subscriptionStep === 1 && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getPackageColor(
                      activePackage.permissionsGranted
                    )} text-white`}
                  >
                    {getPackageIcon(activePackage.permissionsGranted)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Pacote
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activePackage.name}
                    </p>
                    {activePackage.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                        {activePackage.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white px-2.5 py-1.5 dark:bg-slate-800">
                    <p className="text-[10px] uppercase text-slate-500">Preço</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(activePrice)}
                    </p>
                  </div>
                  {activePackage.duration && (
                    <div className="rounded-lg bg-white px-2.5 py-1.5 dark:bg-slate-800">
                      <p className="text-[10px] uppercase text-slate-500">Duração</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {activePackage.duration} dias
                      </p>
                    </div>
                  )}
                </div>

                {activePackage.features && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {activePackage.features.split(',').map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span>{feature.trim()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Passo 2: pagamento */}
          {subscriptionStep === 2 && (
            <div className="mt-4 space-y-3">
              {activePackage.isFree ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Este é um pacote gratuito. Confirme para ativar o pacote{' '}
                  <strong>{activePackage.name}</strong> sem qualquer pagamento.
                </div>
              ) : (
                <>
                  {/* Resumo compacto */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        Pacote
                      </p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {activePackage.name}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        Valor
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(activePrice)}
                      </p>
                    </div>
                  </div>

                  {/* Método */}
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Método de pagamento
                    </p>
                    {paymentMethods.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {paymentMethods.map((method) => {
                          const checked = paymentMethod === method.code;
                          return (
                            <label
                              key={method.code}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                                checked
                                  ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
                              }`}
                            >
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={method.code}
                                checked={checked}
                                onChange={() => setPaymentMethod(method.code)}
                                className="h-3.5 w-3.5 text-brand-600 focus:ring-brand-500"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                  {method.label}
                                </p>
                                {method.provider && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {method.provider}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
                        Não há um método M-Pesa ativo configurado para pagar a subscrição.
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        Número de telemóvel M-Pesa
                      </label>
                      <input
                        type="tel"
                        value={paymentNumber}
                        onChange={(e) => setPaymentNumber(e.target.value)}
                        placeholder="Ex: 84xxxxxxx ou 85xxxxxxx"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Será enviado um pedido M-Pesa para este número.
                      </p>
                    </div>

                    <label className="mt-3 flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={autoRenew}
                        onChange={(e) => setAutoRenew(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Ativar renovação automática
                      </span>
                    </label>
                  </div>

                  <div className="rounded-xl bg-sky-50 px-3 py-2.5 text-xs text-sky-800 dark:bg-sky-950/30 dark:text-sky-300">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      Pagamento direto na API principal
                    </p>
                    <p className="mt-1">
                      Este pagamento é processado diretamente na API de pagamentos e não debita
                      nenhuma das suas carteiras.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                if (subscriptionStep > 1) setSubscriptionStep(subscriptionStep - 1);
                else closeSubscription();
              }}
              disabled={subscribingId !== null}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {subscriptionStep > 1 ? 'Voltar' : 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={
                subscriptionStep === 1
                  ? () => setSubscriptionStep(2)
                  : handleConfirmSubscription
              }
              disabled={confirmDisabled}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {subscriptionStep === 1
                ? 'Próximo'
                : subscribingId
                  ? 'A processar...'
                  : activePackage.isFree
                    ? 'Confirmar ativação'
                    : 'Pagar agora'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ── Vista principal ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
          Cliente
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Pacotes e Subscrições
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Veja os pacotes disponíveis e subscreva ao que melhor atende às suas necessidades.
        </p>
      </div>

      {/* Pacotes */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Escolha um pacote
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {packages.length}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 h-6 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 h-9 rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Package className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600" />
            <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">
              Não existem pacotes disponíveis
            </p>
            <p className="mt-1 text-xs">Volte mais tarde para ver as novidades</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pack) => (
              <PackageCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </section>

      {/* Subscrições */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            As suas subscrições
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {subscriptions.length}
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400">
            <Package className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Ainda não tem subscrições
            </p>
            <p className="mt-1 text-xs">Subscreva a um pacote para começar</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {subscriptions.map((sub) => {
              const isActive =
                sub.status === 'active' && new Date(sub.expiresAt) > new Date();
              return (
                <div
                  key={sub.id}
                  className={`rounded-2xl border p-4 transition hover:shadow-sm ${
                    isActive
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/20'
                      : 'border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {sub.Package?.name || 'Pacote'}
                      </p>
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                        <p>Início: {formatDate(sub.startedAt)}</p>
                        <p>Expira: {formatDate(sub.expiresAt)}</p>
                        {sub.PaymentTransaction?.reference && (
                          <p className="break-all font-mono">
                            Ref: {sub.PaymentTransaction.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {isActive ? 'Ativo' : 'Expirado'}
                    </span>
                  </div>

                  {sub.autoRenew && isActive && (
                    <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                      <RefreshCw className="h-3 w-3" />
                      Renovação automática
                    </p>
                  )}

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleRenew(sub)}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                    >
                      Renovar subscrição
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Packages;