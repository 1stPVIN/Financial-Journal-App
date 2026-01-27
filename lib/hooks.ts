import { useState, useEffect } from "react";

export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // Initialize with initialValue first to match server-side rendering
    const [state, setState] = useState<T>(initialValue);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Only run on client
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setState(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
        setIsHydrated(true);
    }, [key]);

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(state) : value;

            setState(valueToStore);

            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error saving localStorage key "${key}":`, error);
        }
    };

    // Return initialValue until hydrated to prevent mismatch
    return [isHydrated ? state : initialValue, setValue];
}
