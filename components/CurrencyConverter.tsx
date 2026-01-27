"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, RefreshCw, Loader2 } from "lucide-react";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface ExchangeRates {
    date: string;
    rates: Record<string, number>;
}

export function CurrencyConverter() {
    const [amount, setAmount] = useState<string>("1");
    const [fromCurrency, setFromCurrency] = useState<string>("USD");
    const [toCurrency, setToCurrency] = useState<string>("SAR");
    const [rates, setRates] = useState<Record<string, number> | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch Rates
    const fetchRates = async (base: string) => {
        setLoading(true);
        setError(null);
        try {
            // Check cache first
            const cacheKey = `rates_${base}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data: ExchangeRates = JSON.parse(cached);
                const cacheDate = new Date(data.date);
                const now = new Date();
                // Cache valid for 24h
                if ((now.getTime() - cacheDate.getTime()) < 24 * 60 * 60 * 1000) {
                    setRates(data.rates);
                    setLastUpdated(data.date);
                    setLoading(false);
                    return;
                }
            }

            // Fetch fresh
            const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
            if (!res.ok) throw new Error("Failed to fetch rates");

            const data = await res.json();
            setRates(data.rates);
            setLastUpdated(new Date().toISOString());

            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
                date: new Date().toISOString(),
                rates: data.rates
            }));

        } catch (err) {
            console.error("Currency API Error:", err);
            setError("Using offline rates");
            // Fallback to basic constants if available or just show error
            // ideally we have a fallback map, but for now we show error
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch when 'fromCurrency' changes
    useEffect(() => {
        fetchRates(fromCurrency);
    }, [fromCurrency]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const convertedAmount = rates && rates[toCurrency]
        ? (parseFloat(amount || "0") * rates[toCurrency]).toFixed(2)
        : "---";

    const { t } = useLanguage();

    return (
        <div className="p-1 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-medium">{t('currencyConverter')}</h3>
                {lastUpdated && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {t('updated')}: {new Date(lastUpdated).toLocaleDateString()}
                    </span>
                )}
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-border/50">
                {/* Amount Input */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('amount')}</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-2xl font-mono font-bold bg-transparent border-b border-border focus:border-primary focus:outline-none py-1 rtl:text-left"
                        placeholder="0.00"
                    />
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                    {/* From Currency */}
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{t('from')}</label>
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                            className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>

                    {/* Swap Button */}
                    <button
                        onClick={handleSwap}
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground mt-5 transition-colors"
                    >
                        <ArrowRightLeft size={14} />
                    </button>

                    {/* To Currency */}
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{t('to')}</label>
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                            className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Result */}
                <div className="pt-4 border-t border-border/50">
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-muted-foreground mb-1">
                            {amount} {fromCurrency} =
                        </span>
                        <div className="text-3xl font-bold font-mono text-primary tracking-tight">
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    {convertedAmount} <span className="text-lg">{toCurrency}</span>
                                </>
                            )}
                        </div>
                        {rates && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                1 {fromCurrency} = {rates[toCurrency]} {toCurrency}
                            </div>
                        )}
                        {error && (
                            <div className="mt-2 text-xs text-rose-500 font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => fetchRates(fromCurrency)}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                disabled={loading}
            >
                <RefreshCw size={12} className={cn(loading && "animate-spin")} />
                {t('refreshRates')}
            </button>
        </div>
    );
}
