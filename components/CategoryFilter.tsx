"use client";

import { useState, useRef, useEffect } from "react";
import { Category } from "@/lib/types";
import { iconMap } from "@/lib/constants";
import { useLanguage } from "@/lib/language-context";
import { Filter, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
    categories: Category[];
    selectedFilter: string;
    onSelect: (id: string) => void;
}

export function CategoryFilter({ categories, selectedFilter, onSelect }: CategoryFilterProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Group Categories
    const income = categories.filter(c => c.type === "income");
    const expense = categories.filter(c => c.type === "expense");
    const savings = categories.filter(c => c.type === "savings");

    // Get selected category name
    const getSelectedLabel = () => {
        if (selectedFilter === "all") return t('allCategories');
        const cat = categories.find(c => c.id === selectedFilter);
        return cat?.name || t('allCategories');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsOpen(false);
    };

    const renderCategoryItem = (c: Category) => {
        const Icon = iconMap[c.icon] || iconMap["Home"];
        const isSelected = selectedFilter === c.id;

        return (
            <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                    isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
            >
                <span className="w-5 flex justify-center">
                    {isSelected && <Check size={14} className="text-primary" />}
                </span>
                <div className="p-1 rounded bg-muted/50" style={{ color: c.color }}>
                    <Icon size={12} />
                </div>
                <span>{c.name}</span>
            </button>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-[180px] items-center justify-between rounded-full border border-border bg-background px-3 py-2 text-sm shadow-sm hover:border-primary transition-all duration-300 focus:ring-1 focus:ring-primary focus:outline-none glow-active"
            >
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <span className="truncate">{getSelectedLabel()}</span>
                </div>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu - NO Portal, positioned relative to parent */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-56 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                    <div className="p-1">
                        {/* All Categories Option */}
                        <button
                            onClick={() => handleSelect("all")}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md font-medium transition-colors text-left",
                                selectedFilter === "all" ? "bg-accent text-accent-foreground" : "hover:bg-muted text-primary"
                            )}
                        >
                            <span className="w-5 flex justify-center">
                                {selectedFilter === "all" && <Check size={14} className="text-primary" />}
                            </span>
                            <span>{t('allCategories')}</span>
                        </button>

                        {/* Income Group */}
                        {income.length > 0 && (
                            <div className="mt-1">
                                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-emerald-600/70 font-semibold">
                                    {t('income')}
                                </div>
                                {income.map(renderCategoryItem)}
                            </div>
                        )}

                        {/* Expense Group */}
                        {expense.length > 0 && (
                            <div className="mt-1">
                                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-rose-600/70 font-semibold">
                                    {t('expense')}
                                </div>
                                {expense.map(renderCategoryItem)}
                            </div>
                        )}

                        {/* Savings Group */}
                        {savings.length > 0 && (
                            <div className="mt-1">
                                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-amber-600/70 font-semibold">
                                    {t('savings')}
                                </div>
                                {savings.map(renderCategoryItem)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
