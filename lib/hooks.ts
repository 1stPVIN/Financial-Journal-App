
import { useState, useEffect, useRef } from 'react';

/**
 * Hook to persist state to localStorage
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        if (typeof window !== "undefined") {
            try {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : initialValue;
            } catch (error) {
                console.error(error);
                return initialValue;
            }
        }
        return initialValue;
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(error);
            }
        }
    }, [key, state]);

    return [state, setState];
}

/**
 * Hook to fetch exchange rates
 */
export function useExchangeRates(baseCurrency: string) {
    const [rates, setRates] = useState<Record<string, number> | null>(null);
    const [loading, setLoading] = useState(false);

    // Use a ref to prevent infinite loops if baseCurrency changes rapidly or strict mode
    const cacheRef = useRef<Record<string, any>>({});

    useEffect(() => {
        const fetchRates = async () => {
            // Check memory cache first
            if (cacheRef.current[baseCurrency]) {
                setRates(cacheRef.current[baseCurrency]);
                return;
            }

            setLoading(true);
            try {
                // Check localStorage cache
                const cacheKey = `rates_${baseCurrency}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const data = JSON.parse(cached);
                    const cacheDate = new Date(data.date);
                    const now = new Date();

                    // Valid for 24 hours
                    if ((now.getTime() - cacheDate.getTime()) < 24 * 60 * 60 * 1000) {
                        setRates(data.rates);
                        cacheRef.current[baseCurrency] = data.rates;
                        setLoading(false);
                        return;
                    }
                }

                // Fetch Fresh
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();
                setRates(data.rates);
                cacheRef.current[baseCurrency] = data.rates;

                // Save to localStorage
                localStorage.setItem(cacheKey, JSON.stringify({
                    date: new Date().toISOString(),
                    rates: data.rates
                }));
            } catch (err) {
                console.error("Exchange Rate Error:", err);
                // Fallback?
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
    }, [baseCurrency]);

    return { rates, loading };
}
