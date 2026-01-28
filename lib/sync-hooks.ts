import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { supabase } from './supabase';

/**
 * Hook to persist state to localStorage AND sync with Supabase
 * @param key LocalStorage Key
 * @param tableName Supabase Table Name
 * @param initialValue Default Value
 * @param mapper Function to map local data to DB row structure (optional)
 */
export function useSyncedState<T extends { id: string | number }>(
    key: string,
    tableName: string,
    initialValue: T[]
): [T[], (value: T[] | ((val: T[]) => T[])) => void, boolean] {
    const { user } = useSupabase();
    const [isSyncing, setIsSyncing] = useState(false);

    // 1. Initial Load from LocalStorage
    const [state, setState] = useState<T[]>(() => {
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

    // 2. Persist to LocalStorage whenever state changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(error);
            }
        }
    }, [key, state]);

    // 3. Sync with Supabase when User is logged in
    useEffect(() => {
        if (!user) return;

        let mounted = true;

        const syncData = async () => {
            setIsSyncing(true);
            try {
                // A. FETCH Cloud Data
                const { data: cloudData, error } = await supabase
                    .from(tableName)
                    .select('*');

                if (error) throw error;

                if (cloudData && cloudData.length > 0) {
                    // MERGE Strategy:
                    // 1. Cloud wins? Or Latest wins?
                    // For simplicity: Cloud wins on initial load if cloud has data
                    // But we should try to merge IDs
                    if (mounted) {
                        setState(prev => {
                            // Create a map of existing items
                            const itemMap = new Map(prev.map(i => [String(i.id), i]));

                            // Merge cloud items
                            cloudData.forEach((cloudItem: any) => {
                                // Clean Supabase fields if necessary 
                                const { created_at, user_id, ...rest } = cloudItem;
                                // Need to cast ID types if necessary?
                                // Assuming ID is string in both for now due to Schema
                                itemMap.set(String(rest.id), rest as T);
                            });

                            return Array.from(itemMap.values());
                        });
                    }
                } else if (state.length > 0) {
                    // B. If Cloud is Empty but Local has data -> UPLOAD Local
                    // Loop and insert
                    // Note: This might be heavy if many items.
                    const rowsToInsert = state.map(item => ({
                        ...item,
                        user_id: user.id
                    }));

                    const { error: insertError } = await supabase
                        .from(tableName)
                        .upsert(rowsToInsert);

                    if (insertError) console.error("Initial Upload Error:", insertError);
                }
            } catch (err) {
                console.error(`Sync Error (${tableName}):`, err);
            } finally {
                if (mounted) setIsSyncing(false);
            }
        };

        syncData();

        return () => { mounted = false; };
    }, [user, tableName]); // Run on mount or when user changes

    // 4. Custom Setter that also pushes to Cloud
    const setSyncedState = useCallback((newValue: T[] | ((val: T[]) => T[])) => {
        setState(current => {
            const nextState = typeof newValue === 'function' ? newValue(current) : newValue;

            // Push to Cloud if logged in
            if (user) {
                // Ideally we debounce this or only push changed rows
                // For simplicity: We push the WHOLE state? No, that's dangerous/heavy.
                // Better: We assume the CALLER knows what changed (add/update/delete)
                // But this hook API mimics useState, so we don't know the delta.

                // Hacky Solution for V1:
                // Upsert everything?
                // Or better: Rely on the 'Sync Button' for manual sync to save reads/writes?
                // Real-time:
                // Let's TRY to upsert the entire array for small datasets (categories).
                // For Transactions, this is BAD.

                // OPTIMIZATION:
                // Only Sync when the USER explicitly triggers an action in the UI components?
                // This hook creates a 'passive' sync on load.
                // We will add an explicit 'push' logic elsewhere or here?

                // Let's implement a "Background Upsert"
                const rows = nextState.map(item => ({
                    ...item,
                    user_id: user.id,
                    // Convert ID to string if needed (Supabase DB uses Text for ID per our schema)
                    id: String(item.id)
                }));

                // Fire and forget (don't await)
                supabase.from(tableName).upsert(rows).then(({ error }) => {
                    if (error) console.error(`Background Sync Error (${tableName}):`, error);
                });
            }

            return nextState;
        });
    }, [user, tableName]);

    return [state, setSyncedState, isSyncing];
}
