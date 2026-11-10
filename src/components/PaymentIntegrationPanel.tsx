import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from './ArchitecturalGlyphs';
import {
  PAYMENT_MEMBERSHIP_PLANS,
  PaymentPlanId,
  PaymentCurrencyCode,
  PaymentMethodType,
  PaymentTransactionRecord,
  resolvePaymentMembershipPlan,
  validateLuhnCardNumber,
  validatePaymentCheckoutRequest,
  buildPaymentInvoicePdfSpec,
} from '../utils/rules';

interface PaymentIntegrationPanelProps {
  uid: string;
  userEmail: string;
  userName: string;
  sessionToken?: string | null;
  onMembershipActivated?: (params: {
    planId: PaymentPlanId;
    planName: string;
    badgeLabel: string;
    bonusPointsAwarded: number;
    streakFreezesIncluded: number;
  }) => void;
}

export const PaymentIntegrationPanel: React.FC<PaymentIntegrationPanelProps> = ({
  uid,
  userEmail,
  userName,
  sessionToken,
  onMembershipActivated,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<PaymentPlanId>(
    'plan_scholar_pro_monthly'
  );
  const [currency, setCurrency] = useState<PaymentCurrencyCode>('USD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');

  const [cardholderName, setCardholderName] = useState<string>(userName || '');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [billingEmail, setBillingEmail] = useState<string>(userEmail || '');

  const [activeMembership, setActiveMembership] = useState<{
    planId: PaymentPlanId;
    planName: string;
    badgeLabel: string;
    activatedAtIso: string;
    transactionId: string;
  }>({
    planId: 'plan_free_sanctuary',
    planName: 'Free Sanctuary Member',
    badgeLabel: 'Free Member',
    activatedAtIso: '',
    transactionId: '',
  });
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPlan = resolvePaymentMembershipPlan(selectedPlanId);
  const liveLuhnCheck = validateLuhnCardNumber(cardNumber);

  useEffect(() => {
    let cancelled = false;
    async function fetchPaymentStatus() {
      try {
        const res = await fetch(
          `/api/payments/status?uid=${encodeURIComponent(uid)}`,
          {
            headers: sessionToken
              ? { Authorization: `Bearer ${sessionToken}` }
              : undefined,
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.activeMembership) {
          setActiveMembership(data.activeMembership);
        }
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
        if (data.gateways) {
          setStripeConfigured(Boolean(data.gateways.stripeConfigured));
        }
      } catch {
        // ignore network error on initial load
      }
    }
    fetchPaymentStatus();
    return () => {
      cancelled = true;
    };
  }, [uid, sessionToken]);

  const handleFormatCardNumberChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 19);
    const groups = digitsOnly.match(/.{1,4}/g) || [];
    setCardNumber(groups.join(' '));
    setErrorMessage(null);
  };

  const handleFormatExpiryChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d/]/g, '').slice(0, 7);
    if (cleaned.length === 2 && !cleaned.includes('/') && cardExpiry.length === 1) {
      setCardExpiry(`${cleaned}/`);
    } else {
      setCardExpiry(cleaned);
    }
    setErrorMessage(null);
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validation (never bypasses empty or invalid inputs)
    const validation = validatePaymentCheckoutRequest({
      planId: selectedPlanId,
      currency,
      paymentMethod,
      cardholderName,
      cardNumber,
      cardExpiry,
      cardCvv,
      upiVpa,
      billingEmail,
    });

    if (!validation.valid) {
      setErrorMessage(validation.reason);
      return;
    }

    setIsProcessing(true);
    try {
      // If W3C PaymentRequest API is selected and supported in browser, invoke native payment sheet first
      if (
        paymentMethod === 'w3c_payment_request' &&
        typeof window !== 'undefined' &&
        'PaymentRequest' in window
      ) {
        try {
          const supportedInstruments = [{ supportedMethods: 'basic-card' }];
          const details = {
            total: {
              label: `${selectedPlan.name} (${selectedPlan.billingCycle})`,
              amount: {
                currency,
                value:
                  currency === 'INR'
                    ? (selectedPlan.priceInrPaise / 100).toFixed(2)
                    : (selectedPlan.priceUsdCents / 100).toFixed(2),
              },
            },
          };
          const request = new window.PaymentRequest(supportedInstruments, details);
          const canMake = await request.canMakePayment().catch(() => false);
          if (canMake) {
            const paymentResponse = await request.show();
            await paymentResponse.complete('success');
          }
        } catch {
          // Proceed with server-side settlement if browser sheet is unavailable in headless/iframe context
        }
      }

      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          uid,
          userName,
          userEmail: billingEmail || userEmail,
          billingEmail: billingEmail || userEmail,
          planId: selectedPlanId,
          currency,
          paymentMethod,
          cardholderName,
          cardNumber,
          cardExpiry,
          cardCvv,
          upiVpa,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Payment processing failed. Please verify your details.');
        setIsProcessing(false);
        return;
      }

      if (data.activeMembership) {
        setActiveMembership(data.activeMembership);
      }
      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }

      const tx: PaymentTransactionRecord | undefined = data.transaction;
      setSuccessMessage(
        tx
          ? `Payment verified (${tx.formattedAmount}) · Invoice ${tx.invoiceNumber} · ${selectedPlan.name} is now active!`
          : `${selectedPlan.name} activated!`
      );
      setCardCvv('');

      if (onMembershipActivated) {
        onMembershipActivated({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          badgeLabel: selectedPlan.badgeLabel,
          bonusPointsAwarded: selectedPlan.bonusParticipationPoints,
          streakFreezesIncluded: selectedPlan.streakFreezesIncluded,
        });
      }
    } catch {
      setErrorMessage('Network error while communicating with payment gateway.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundTransaction = async (transactionId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ uid, transactionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Unable to process refund.');
        return;
      }
      if (data.activeMembership) {
        setActiveMembership(data.activeMembership);
      }
      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      setSuccessMessage(`Transaction ${transactionId} refunded and membership updated.`);
    } catch {
      setErrorMessage('Network error while requesting refund.');
    }
  };

  const handleDownloadInvoicePdf = (tx: PaymentTransactionRecord) => {
    const pdfSpec = buildPaymentInvoicePdfSpec(tx);
    const blob = new Blob([pdfSpec.pdfContent], { type: pdfSpec.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', pdfSpec.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSuccessMessage(`Downloaded official tax invoice ${pdfSpec.filename}`);
  };

  return (
    <section
      id="payment-integration-panel"
      data-testid="payment-integration-panel"
      aria-label="Membership Plans, Payment Checkout & Invoice Ledger"
      className="p-6 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] space-y-6"
    >
      {/* Header & Current Membership Status */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">
              Membership &amp; Payment Checkout
            </h2>
            <span
              data-testid="active-membership-tier-badge"
              className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${
                activeMembership.planId !== 'plan_free_sanctuary'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}
            >
              Active Tier: {activeMembership.planName}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Upgrade your Study Sanctuary membership via Luhn-verified Card Checkout, Instant UPI VPA, or W3C Payment Request with HMAC-SHA256 signed tax invoices.
          </p>
        </div>

        {/* Currency Switcher */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg bg-[#050507] border border-zinc-800"
          role="group"
          aria-label="Billing Currency"
        >
          <button
            type="button"
            onClick={() => setCurrency('USD')}
            data-testid="payment-currency-usd-btn"
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${
              currency === 'USD'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            USD ($)
          </button>
          <button
            type="button"
            onClick={() => setCurrency('INR')}
            data-testid="payment-currency-inr-btn"
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${
              currency === 'INR'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            INR (₹)
          </button>
        </div>
      </div>

      {/* 3 Membership Plans Selector */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        role="radiogroup"
        aria-label="Select Membership Plan"
      >
        {PAYMENT_MEMBERSHIP_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isCurrentActive = activeMembership.planId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => {
                setSelectedPlanId(plan.id);
                setErrorMessage(null);
              }}
              data-testid={`payment-plan-card-${plan.id}`}
              className={`p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-emerald-950/20 border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
                  : 'bg-[#050507] border-zinc-800/90 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    {plan.badgeLabel}
                  </span>
                  {isCurrentActive ? (
                    <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-emerald-500 text-black font-bold">
                      Active Plan
                    </span>
                  ) : isSelected ? (
                    <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Selected
                    </span>
                  ) : null}
                </div>

                <h3 className="text-base font-bold text-white">{plan.name}</h3>
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {currency === 'INR' ? plan.formattedInr : plan.formattedUsd}
                </div>
                <p className="text-xs text-zinc-400">{plan.tagline}</p>

                <ul className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs text-zinc-300">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlanId(plan.id);
                  setErrorMessage(null);
                }}
                data-testid={`select-plan-btn-${plan.id}`}
                className={`w-full py-2 px-3 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                }`}
              >
                {isSelected ? `Selected: ${plan.name}` : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Main Split: Left 7 Cols Payment Checkout Form + Right 5 Cols Live Invoice & Transaction Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Payment Method & Checkout Form */}
        <form
          onSubmit={handleProcessCheckout}
          className="lg:col-span-7 p-5 rounded-lg border border-zinc-800/90 bg-[#050507] space-y-4"
          data-testid="payment-checkout-form"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                Payment Details · {selectedPlan.name} (
                {currency === 'INR'
                  ? selectedPlan.formattedInr
                  : selectedPlan.formattedUsd}
                )
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              HMAC-SHA256 Signed Settlement
            </span>
          </div>

          {/* Payment Method Selector Tabs */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            role="group"
            aria-label="Select Payment Method"
          >
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('card');
                setErrorMessage(null);
              }}
              data-testid="payment-method-card-btn"
              className={`py-2 px-3 rounded border text-xs font-semibold transition-colors cursor-pointer ${
                paymentMethod === 'card'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#0A0A0C] border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Credit / Debit Card
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('upi');
                setErrorMessage(null);
              }}
              data-testid="payment-method-upi-btn"
              className={`py-2 px-3 rounded border text-xs font-semibold transition-colors cursor-pointer ${
                paymentMethod === 'upi'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#0A0A0C] border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Instant UPI (VPA)
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('w3c_payment_request');
                setErrorMessage(null);
              }}
              data-testid="payment-method-w3c-btn"
              className={`py-2 px-3 rounded border text-xs font-semibold transition-colors cursor-pointer ${
                paymentMethod === 'w3c_payment_request'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#0A0A0C] border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Browser Pay (W3C)
            </button>
          </div>

          {/* Billing Email */}
          <div>
            <label
              htmlFor="payment-billing-email-input"
              className="block text-xs font-mono text-zinc-300 mb-1"
            >
              Billing Email for Official Tax Invoice
            </label>
            <input
              id="payment-billing-email-input"
              data-testid="payment-billing-email-input"
              type="email"
              value={billingEmail}
              onChange={(e) => {
                setBillingEmail(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="mahitsaxena44@gmail.com"
              className="w-full px-3 py-2 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Card Fields */}
          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="payment-cardholder-name-input"
                  className="block text-xs font-mono text-zinc-300 mb-1"
                >
                  Cardholder Full Name
                </label>
                <input
                  id="payment-cardholder-name-input"
                  data-testid="payment-cardholder-name-input"
                  type="text"
                  value={cardholderName}
                  onChange={(e) => {
                    setCardholderName(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Mahit Saxena"
                  className="w-full px-3 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="payment-card-number-input"
                    className="block text-xs font-mono text-zinc-300"
                  >
                    Card Number (ISO Luhn Mod-10 Verified)
                  </label>
                  {cardNumber.trim().length > 0 && (
                    <span
                      data-testid="payment-card-luhn-badge"
                      className={`text-[11px] font-mono ${
                        liveLuhnCheck.valid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {liveLuhnCheck.valid
                        ? `${liveLuhnCheck.cardBrand} · Checksum Valid`
                        : 'Enter valid 13–19 digit card'}
                    </span>
                  )}
                </div>
                <input
                  id="payment-card-number-input"
                  data-testid="payment-card-number-input"
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => handleFormatCardNumberChange(e.target.value)}
                  placeholder="4532 0151 1283 0366"
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="payment-card-expiry-input"
                    className="block text-xs font-mono text-zinc-300 mb-1"
                  >
                    Expiry Date (MM/YY)
                  </label>
                  <input
                    id="payment-card-expiry-input"
                    data-testid="payment-card-expiry-input"
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => handleFormatExpiryChange(e.target.value)}
                    placeholder="08/28"
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="payment-card-cvv-input"
                    className="block text-xs font-mono text-zinc-300 mb-1"
                  >
                    Security Code (CVV/CVC)
                  </label>
                  <input
                    id="payment-card-cvv-input"
                    data-testid="payment-card-cvv-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => {
                      setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setErrorMessage(null);
                    }}
                    placeholder="842"
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* UPI Fields */}
          {paymentMethod === 'upi' && (
            <div className="space-y-2">
              <label
                htmlFor="payment-upi-vpa-input"
                className="block text-xs font-mono text-zinc-300"
              >
                UPI Virtual Payment Address (VPA)
              </label>
              <input
                id="payment-upi-vpa-input"
                data-testid="payment-upi-vpa-input"
                type="text"
                value={upiVpa}
                onChange={(e) => {
                  setUpiVpa(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="mahit@okicici"
                className="w-full px-3 py-2 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-400">
                Supports all NPCI UPI handles (@okicici, @okhdfcbank, @oksbi, @ybl, @paytm, @upi).
              </p>
            </div>
          )}

          {/* W3C Browser Pay Info */}
          {paymentMethod === 'w3c_payment_request' && (
            <div className="p-3 rounded bg-[#0A0A0C] border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>W3C Native Browser Payment Sheet</span>
              </div>
              <p className="text-zinc-400">
                Uses your browser&apos;s saved payment methods (`window.PaymentRequest`) and settles directly with HMAC-SHA256 receipt signing.
              </p>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              data-testid="payment-checkout-error"
              className="p-3 rounded bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-300"
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              data-testid="payment-checkout-success"
              className="p-3 rounded bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            data-testid="payment-submit-btn"
            className="w-full py-2.5 px-4 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>
              {isProcessing
                ? 'Processing & Signing Receipt...'
                : `Pay ${
                    currency === 'INR'
                      ? selectedPlan.formattedInr
                      : selectedPlan.formattedUsd
                  } & Activate ${selectedPlan.name}`}
            </span>
          </button>

          {stripeConfigured && (
            <p className="text-[11px] font-mono text-emerald-400 text-center">
              Live Stripe Checkout Gateway Connected
            </p>
          )}
        </form>

        {/* Right 5 Cols: Live Signed Invoices & Transaction History Ledger */}
        <div
          className="lg:col-span-5 p-5 rounded-lg border border-zinc-800/90 bg-[#050507] space-y-4"
          data-testid="payment-transactions-ledger"
        >
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                Invoices &amp; Payment Ledger ({transactions.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Authoritative Records
            </span>
          </div>

          {transactions.length === 0 ? (
            <div
              className="p-4 rounded bg-[#0A0A0C] border border-zinc-800/80 text-xs text-zinc-400 space-y-1"
              data-testid="payment-transactions-empty"
            >
              <div className="font-semibold text-zinc-200">
                No payment transactions recorded yet.
              </div>
              <p>
                Complete a membership checkout on the left to generate a cryptographically signed HMAC-SHA256 receipt and downloadable PDF tax invoice.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  data-testid={`payment-transaction-row-${tx.invoiceNumber}`}
                  className="p-3.5 rounded border border-zinc-800 bg-[#0A0A0C] space-y-2 text-xs font-mono tabular-nums"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">
                      {tx.invoiceNumber} · {tx.planName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.status === 'succeeded'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-300">
                    <span>{tx.paymentInstrumentSummary}</span>
                    <strong className="text-emerald-400">
                      {tx.formattedAmount}
                    </strong>
                  </div>

                  <div className="text-[10px] text-zinc-500 truncate">
                    TXN: {tx.transactionId} · HMAC: {tx.receiptSignatureHmac.slice(0, 16)}...
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoicePdf(tx)}
                      data-testid={`download-invoice-pdf-btn-${tx.invoiceNumber}`}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-zinc-700 inline-flex items-center gap-1.5 text-[11px] cursor-pointer"
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>Download PDF Invoice</span>
                    </button>

                    {tx.status === 'succeeded' && (
                      <button
                        type="button"
                        onClick={() => handleRefundTransaction(tx.transactionId)}
                        data-testid={`refund-transaction-btn-${tx.invoiceNumber}`}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] cursor-pointer"
                      >
                        Refund / Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
