"use client";

import { X } from "lucide-react";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";

interface SettingsDialogProps {
    currentCurrency: string;
    onCurrencyChange: (currency: string) => void;
    uiMode: "standard" | "simplified";
    onUiModeChange: (mode: "standard" | "simplified") => void;
    salary: number;
    onSalaryChange: (amount: number) => void;
    budget: number;
    onBudgetChange: (amount: number) => void;
    onClose: () => void;
    onReset: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    isDarkMode: boolean;
    onDarkModeChange: (isDark: boolean) => void;
    // View Mode
    viewMode: "monthly" | "yearly" | "all";
    onViewModeChange: (mode: "monthly" | "yearly" | "all") => void;
    // Widget Toggles
    showCommitmentsWidget: boolean;
    onShowCommitmentsWidgetChange: (show: boolean) => void;
    showConverterWidget: boolean;
    onShowConverterWidgetChange: (show: boolean) => void;
    // Data Props for Backup/Restore
    transactions: any[];
    categories: any[];
    recurringExpenses: any[];
}

export function SettingsDialog({
    currentCurrency,
    onCurrencyChange,
    uiMode,
    onUiModeChange,
    salary,
    onSalaryChange,
    budget,
    onBudgetChange,
    onClose,
    onReset,
    currentTheme,
    onThemeChange,
    isDarkMode,
    onDarkModeChange,
    viewMode,
    onViewModeChange,
    showCommitmentsWidget,
    onShowCommitmentsWidgetChange,
    showConverterWidget,
    onShowConverterWidgetChange,
    transactions,
    categories,
    recurringExpenses,
}: SettingsDialogProps) {
    const [hasBackup, setHasBackup] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const { language, setLanguage, t } = useLanguage();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const backup = localStorage.getItem("last_auto_backup");
            setHasBackup(!!backup);
            const password = localStorage.getItem("auth_password_hash");
            setHasPassword(!!password);
        }
    }, []);

    const themes = [
        { id: 'classic', name: 'Classic', color: '#fdfbf7' },
        { id: 'midnight', name: 'Midnight', color: '#0f172a' },
        { id: 'emerald', name: 'Emerald', color: '#022c22' },
        { id: 'royal', name: 'Royal', color: '#2e1065' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-background w-full max-w-md rounded-lg shadow-xl border border-border overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-serif text-primary">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
                    {/* Language */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('language')}
                        </label>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setLanguage('en')}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                                    language === 'en'
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t('english')}
                            </button>
                            <button
                                onClick={() => setLanguage('ar')}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all font-serif",
                                    language === 'ar'
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t('arabic')}
                            </button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* Appearance */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('appearanceCurrency')}
                        </label>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                            <span className="text-sm font-medium">{t('darkMode')}</span>
                            <button
                                onClick={() => onDarkModeChange(!isDarkMode)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    isDarkMode ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform rtl:right-1 rtl:left-auto",
                                    isDarkMode ? "translate-x-6 rtl:-translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => onThemeChange(t.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm border transition-all",
                                        currentTheme === t.id
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-card border-border text-foreground hover:border-primary/50"
                                    )}
                                >
                                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.color }}></div>
                                    <span>{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* Security */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Security
                        </label>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">App Lock</span>
                                <span className="text-xs text-muted-foreground">Require password on starup</span>
                            </div>

                            {hasPassword ? (
                                <button
                                    onClick={() => {
                                        if (confirm("Remove password protection?")) {
                                            localStorage.removeItem("auth_password_hash");
                                            setHasPassword(false);
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-md text-xs font-medium transition-colors"
                                >
                                    Remove Lock
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowPasswordInput(true)}
                                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md text-xs font-medium transition-colors"
                                >
                                    Set Password
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showPasswordInput && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-2">
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:border-ring"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) {
                                                        localStorage.setItem("auth_password_hash", btoa(val));
                                                        setHasPassword(true);
                                                        setShowPasswordInput(false);
                                                    }
                                                }
                                            }}
                                            ref={(input) => {
                                                if (input) input.focus();
                                            }}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setShowPasswordInput(false)}
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    // Find input sibling? React ref is cleaner.
                                                    // For quick impl: select previous sibling input
                                                    const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement);
                                                    if (input && input.value) {
                                                        localStorage.setItem("auth_password_hash", btoa(input.value));
                                                        setHasPassword(true);
                                                        setShowPasswordInput(false);
                                                    }
                                                }}
                                                className="text-xs text-primary font-medium hover:underline"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* Dashboard Customization (Widgets) */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Dashboard Widgets
                        </label>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                            <span className="text-sm font-medium">{t('monthlyCommitments')}</span>
                            <button
                                onClick={() => onShowCommitmentsWidgetChange(!showCommitmentsWidget)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    showCommitmentsWidget ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform rtl:right-1 rtl:left-auto",
                                    showCommitmentsWidget ? "translate-x-6 rtl:-translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                            <span className="text-sm font-medium">{t('currencyConverter')}</span>
                            <button
                                onClick={() => onShowConverterWidgetChange(!showConverterWidget)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    showConverterWidget ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform rtl:right-1 rtl:left-auto",
                                    showConverterWidget ? "translate-x-6 rtl:-translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* Currency Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Main Currency
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {CURRENCIES.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => onCurrencyChange(curr.code)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-md text-sm border transition-all",
                                        currentCurrency === curr.code
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-card border-border text-foreground hover:border-primary"
                                    )}
                                >
                                    <span>{curr.name}</span>
                                    <span className={cn("font-mono font-medium", currentCurrency === curr.code ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                        {curr.code}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Financial Goals */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                {t('salaryAndBudget')}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground">{t('monthlySalary')}</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 rtl:right-2.5 rtl:left-auto top-1.5 text-muted-foreground text-xs">{currentCurrency}</span>
                                        <input
                                            type="number"
                                            value={salary}
                                            onChange={(e) => onSalaryChange(Number(e.target.value))}
                                            className="w-full pl-10 pr-3 rtl:pr-10 rtl:pl-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:border-ring transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground">{t('monthlyBudget')}</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 rtl:right-2.5 rtl:left-auto top-1.5 text-muted-foreground text-xs">{currentCurrency}</span>
                                        <input
                                            type="number"
                                            value={budget}
                                            onChange={(e) => onBudgetChange(Number(e.target.value))}
                                            className="w-full pl-10 pr-3 rtl:pr-10 rtl:pl-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:border-ring transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* Simple UI Mode */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('interfaceMode')}
                        </label>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => onUiModeChange("standard")}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                                    uiMode === "standard"
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t('standard')}
                            </button>
                            <button
                                onClick={() => onUiModeChange("simplified")}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                                    uiMode === "simplified"
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t('simplified')}
                            </button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* View Period Mode */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('viewPeriod')}
                        </label>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => onViewModeChange("monthly")}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                                    viewMode === "monthly"
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t('monthly')}
                            </button>
                            <button
                                onClick={() => onViewModeChange("yearly")}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                                    viewMode === "yearly"
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t('yearly')}
                            </button>
                            <button
                                onClick={() => onViewModeChange("all")}
                                className={cn(
                                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                                    viewMode === "all"
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                All Time
                            </button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* Data Management */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('manageData')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    const data = {
                                        transactions,
                                        categories,
                                        recurringExpenses,
                                        settings: {
                                            currency: localStorage.getItem("currency"),
                                            theme: localStorage.getItem("theme"),
                                            salary: localStorage.getItem("salary"),
                                            budget: localStorage.getItem("budget"),
                                            uiMode: localStorage.getItem("uiMode"),
                                            viewMode: localStorage.getItem("viewMode"), // Include viewMode
                                            showCommitmentsWidget: localStorage.getItem("showCommitmentsWidget"),
                                            showConverterWidget: localStorage.getItem("showConverterWidget"),
                                        },
                                        timestamp: new Date().toISOString()
                                    };
                                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `financial_journal_backup_${new Date().toISOString().split('T')[0]}.json`;
                                    a.click();
                                }}
                                className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors text-center gap-2"
                            >
                                <span className="text-sm font-medium">{t('backupData')}</span>
                                <span className="text-[10px] text-muted-foreground">JSON</span>
                            </button>

                            <label className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors text-center gap-2 cursor-pointer">
                                <span className="text-sm font-medium">{t('restoreData')}</span>
                                <span className="text-[10px] text-muted-foreground">JSON</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".json"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            try {
                                                const data = JSON.parse(ev.target?.result as string);
                                                if (data.transactions && data.categories) {
                                                    if (confirm("⚠️ This will overwrite your current data. Continue?")) {
                                                        localStorage.setItem("transactions", JSON.stringify(data.transactions));
                                                        localStorage.setItem("categories", JSON.stringify(data.categories));
                                                        if (data.recurringExpenses) localStorage.setItem("recurringExpenses", JSON.stringify(data.recurringExpenses));
                                                        if (data.settings) {
                                                            if (data.settings.currency) localStorage.setItem("currency", JSON.stringify(data.settings.currency));
                                                            if (data.settings.theme) localStorage.setItem("theme", JSON.stringify(data.settings.theme));
                                                            if (data.settings.salary) localStorage.setItem("salary", JSON.stringify(data.settings.salary));
                                                            if (data.settings.budget) localStorage.setItem("budget", JSON.stringify(data.settings.budget));
                                                            if (data.settings.uiMode) localStorage.setItem("uiMode", JSON.stringify(data.settings.uiMode));
                                                            if (data.settings.viewMode) localStorage.setItem("viewMode", JSON.stringify(data.settings.viewMode));
                                                            if (data.settings.showCommitmentsWidget) localStorage.setItem("showCommitmentsWidget", JSON.stringify(data.settings.showCommitmentsWidget));
                                                            if (data.settings.showConverterWidget) localStorage.setItem("showConverterWidget", JSON.stringify(data.settings.showConverterWidget));
                                                        }
                                                        window.location.reload();
                                                    }
                                                } else {
                                                    alert("Invalid backup file format.");
                                                }
                                            } catch (err) {
                                                alert("Error parsing backup file.");
                                            }
                                        };
                                        reader.readAsText(file);
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="h-[1px] bg-border w-full"></div>

                    {/* Danger Zone */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    if (confirm(t('confirmDelete'))) {
                                        // 1. Auto-Backup (Safety Net)
                                        const safetySnapshot = {
                                            transactions,
                                            categories,
                                            recurringExpenses,
                                            settings: {
                                                currency: localStorage.getItem("currency"),
                                                theme: localStorage.getItem("theme"),
                                                salary: localStorage.getItem("salary"),
                                                budget: localStorage.getItem("budget"),
                                            },
                                            timestamp: new Date().toISOString()
                                        };
                                        localStorage.setItem("last_auto_backup", JSON.stringify(safetySnapshot));

                                        // 2. Perform Reset
                                        onReset();
                                    }
                                }}
                                className="w-full py-2 px-4 border border-destructive/30 text-destructive rounded-md text-sm hover:bg-destructive hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={16} /> {t('resetData')}
                            </button>

                            {/* Restore Last Backup Button (Always visible, disabled if no backup) */}
                            <button
                                disabled={!hasBackup}
                                onClick={() => {
                                    if (confirm("Restore data from the last reset?")) {
                                        const backup = JSON.parse(localStorage.getItem("last_auto_backup") || "{}");
                                        if (backup.transactions) {
                                            localStorage.setItem("transactions", JSON.stringify(backup.transactions));
                                            localStorage.setItem("categories", JSON.stringify(backup.categories));
                                            localStorage.setItem("recurringExpenses", JSON.stringify(backup.recurringExpenses));
                                            if (backup.settings?.currency) localStorage.setItem("currency", backup.settings.currency);
                                            window.location.reload();
                                        }
                                    }
                                }}
                                className={cn(
                                    "w-full py-2 px-4 border rounded-md text-sm transition-colors flex items-center justify-center gap-2",
                                    hasBackup
                                        ? "border-emerald-600/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white"
                                        : "border-border text-muted-foreground opacity-50 cursor-not-allowed bg-muted/50"
                                )}
                            >
                                ♻️ {t('restoreData')} (Undo Reset)
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">

                        </p>
                    </div>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        Success
                    </button>
                </div>
            </motion.div>
        </motion.div >
    );
}
