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
                // 1. Detect Deletions
                const currentIds = new Set(current.map(i => String(i.id)));
                const nextIds = new Set(nextState.map(i => String(i.id)));

                const idsToDelete = current
                    .filter(i => !nextIds.has(String(i.id)))
                    .map(i => String(i.id));

                if (idsToDelete.length > 0) {
                    // Execute Delete
                    supabase.from(tableName)
                        .delete()
                        .in('id', idsToDelete)
                        .then(({ error }) => {
                            if (error) console.error(`Sync Delete Error (${tableName}):`, error);
                        });
                }

                // 2. Upsert Updates/Additions
                // We optimize by checks if possible, but upsert is safe.
                // To save bandwidth, maybe only upsert items that changed? 
                // For now, let's keep it simple and safe: Upsert ALL remaining items.
                // Optimally: Filter items that are new or changed.
                // But deep comparison is expensive.

                if (nextState.length > 0) {
                    const rows = nextState.map(item => ({
                        ...item,
                        user_id: user.id,
                        id: item.id // ID is already string now
                    }));

                    // Fire and forget catch
                    supabase.from(tableName).upsert(rows).then(({ error }) => {
                        if (error) {
                            console.error(`Background Sync Upsert Error (${tableName}):`, error);
                            // Optional: Retry mechanism could go here
                        }
                    });
                } else if (nextState.length === 0 && current.length > 0 && idsToDelete.length === 0) {
                    // Edge case: Cleared all items but logic above handled deletions?
                    // If nextState is empty, idsToDelete should contain ALL current IDs.
                    // So the delete block above handles it.
                }
            }

            return nextState;
        });
    }, [user, tableName]);

    return [state, setSyncedState, isSyncing];
}
