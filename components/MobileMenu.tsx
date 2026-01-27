"use client";

import { X, CalendarClock, Tag, Settings2, FileSpreadsheet, FileText, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenRecurring: () => void;
    onOpenCategories: () => void;
    onOpenSettings: () => void;
    onOpenConverter?: () => void;
    onExportExcel: () => void;
    onExportPDF: () => void;
}

export function MobileMenu({
    isOpen,
    onClose,
    onOpenRecurring,
    onOpenCategories,
    onOpenSettings,
    onOpenConverter,
    onExportExcel,
    onExportPDF
}: MobileMenuProps) {
    const { t, language } = useLanguage();

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden justify-start">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: language === 'ar' ? "100%" : "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: language === 'ar' ? "100%" : "-100%" }}
                        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
                        className="relative w-3/4 max-w-sm h-full bg-background border-r rtl:border-r-0 rtl:border-l border-border shadow-2xl p-6 overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-serif text-primary">{t('financialJournal')}</h2>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Tools Section */}
                            <div>
                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={() => { onClose(); onOpenRecurring(); }} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left rtl:text-right">
                                        <div className="p-2 bg-primary/10 rounded-full text-primary"><CalendarClock size={20} /></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{t('monthlyCommitments')}</div>
                                            <div className="text-xs text-muted-foreground">{t('manageMonthlyBills')}</div>
                                        </div>
                                    </button>
                                    <button onClick={() => { onClose(); onOpenConverter?.(); }} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left rtl:text-right">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Banknote size={20} /></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{t('currencyConverter')}</div>
                                            <div className="text-xs text-muted-foreground">{t('liveExchangeRates')}</div>
                                        </div>
                                    </button>
                                    <button onClick={() => { onClose(); onOpenCategories(); }} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left rtl:text-right">
                                        <div className="p-2 bg-primary/10 rounded-full text-primary"><Tag size={20} /></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{t('categories')}</div>
                                            <div className="text-xs text-muted-foreground">{t('editCategory')}</div>
                                        </div>
                                    </button>
                                    <button onClick={() => { onClose(); onOpenSettings(); }} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left rtl:text-right">
                                        <div className="p-2 bg-primary/10 rounded-full text-primary"><Settings2 size={20} /></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{t('settings')}</div>
                                            <div className="text-xs text-muted-foreground">{t('appearanceCurrency')}</div>
                                        </div>
                                    </button>
                                    <button onClick={() => { onClose(); onExportExcel(); }} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left rtl:text-right">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-700 dark:text-emerald-400"><FileSpreadsheet size={20} /></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{t('exportExcel')}</div>
                                            <div className="text-xs text-muted-foreground">Download spreadsheet</div>
                                        </div>
                                    </button>
                                    <button onClick={() => { onClose(); onExportPDF(); }} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left rtl:text-right">
                                        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full text-rose-700 dark:text-rose-400"><FileText size={20} /></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{t('exportPdf')}</div>
                                            <div className="text-xs text-muted-foreground">Print financial report</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
