"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Share2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePDF } from "@/lib/pdf-generator";
import { Transaction, Category } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

interface ExportMenuProps {
    onExportExcel: () => void;
    transactions: Transaction[];
    summary: { income: number; expense: number; savings: number; net: number; currency: string };
    getCategory: (id: string) => Category | undefined;
}

export function ExportMenu({ onExportExcel, transactions, summary, getCategory }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { t } = useLanguage();

    const handleExportPDF = async () => {
        try {
            await generatePDF(transactions, summary, getCategory);
        } catch (err: any) {
            console.error("PDF Generation Failed", err);
            alert(`${t('couldNotGeneratePdf')} ${err.message || err}`);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative z-50 no-export" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-full transition-all duration-300 flex items-center gap-2",
                    isOpen ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-primary hover:bg-black/5"
                )}
                title={t('exportOptions')}
            >
                <Share2 size={20} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-48 bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-1 space-y-1">
                        <button
                            onClick={() => { onExportExcel(); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg transition-colors group"
                        >
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-md text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={16} />
                            </div>
                            <span>{t('excelReport')}</span>
                        </button>

                        <button
                            onClick={handleExportPDF}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 text-muted-foreground hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-colors group"
                        >
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-md text-rose-700 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                <FileText size={16} />
                            </div>
                            <span>{t('printPdf')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
