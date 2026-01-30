"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

export type SortOption =
    | "date_desc"
    | "date_asc"
    | "amount_desc"
    | "amount_asc"
    | "desc_asc"
    | "desc_desc"
    | "category_asc"
    | "type_asc";

interface SortDropdownProps {
    value: SortOption;
    onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; labelEn: string; labelAr: string }[] = [
    { value: "date_desc", labelEn: "Newest First", labelAr: "الأحدث أولاً" },
    { value: "date_asc", labelEn: "Oldest First", labelAr: "الأقدم أولاً" },
    { value: "amount_desc", labelEn: "Price: High to Low", labelAr: "السعر: من الأعلى للأقل" },
    { value: "amount_asc", labelEn: "Price: Low to High", labelAr: "السعر: من الأقل للأعلى" },
    { value: "desc_asc", labelEn: "A-Z (Description)", labelAr: "أ-ي (الوصف)" },
    { value: "desc_desc", labelEn: "Z-A (Description)", labelAr: "ي-أ (الوصف)" },
    { value: "category_asc", labelEn: "By Category", labelAr: "حسب التصنيف" },
    { value: "type_asc", labelEn: "By Type", labelAr: "حسب النوع" },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const selectedOption = sortOptions.find(o => o.value === value);
    const selectedLabel = language === 'ar' ? selectedOption?.labelAr : selectedOption?.labelEn;

    const handleSelect = (option: SortOption) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-[160px] items-center justify-between rounded-full border border-border bg-background px-3 py-2 text-sm shadow-sm hover:border-primary transition-all duration-300 focus:ring-1 focus:ring-primary focus:outline-none"
            >
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={14} className="text-muted-foreground" />
                    <span className="truncate">{selectedLabel}</span>
                </div>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-56 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2"
                >
                    <div className="p-1">
                        {sortOptions.map((option) => {
                            const isSelected = value === option.value;
                            const label = language === 'ar' ? option.labelAr : option.labelEn;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left rtl:text-right",
                                        isSelected
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <span className="w-5 flex justify-center">
                                        {isSelected && <Check size={14} className="text-primary" />}
                                    </span>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to sort transactions
export function sortTransactions<T extends { date: string; amount: number; desc: string; categoryId: string; type: string }>(
    items: T[],
    sortBy: SortOption,
    getCategoryName?: (id: string) => string
): T[] {
    const sorted = [...items];

    switch (sortBy) {
        case "date_desc":
            return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        case "date_asc":
            return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        case "amount_desc":
            return sorted.sort((a, b) => b.amount - a.amount);
        case "amount_asc":
            return sorted.sort((a, b) => a.amount - b.amount);
        case "desc_asc":
            return sorted.sort((a, b) => a.desc.localeCompare(b.desc));
        case "desc_desc":
            return sorted.sort((a, b) => b.desc.localeCompare(a.desc));
        case "category_asc":
            if (getCategoryName) {
                return sorted.sort((a, b) =>
                    getCategoryName(a.categoryId).localeCompare(getCategoryName(b.categoryId))
                );
            }
            return sorted.sort((a, b) => a.categoryId.localeCompare(b.categoryId));
        case "type_asc":
            const typeOrder = { income: 1, expense: 2, savings: 3 };
            return sorted.sort((a, b) =>
                (typeOrder[a.type as keyof typeof typeOrder] || 4) -
                (typeOrder[b.type as keyof typeof typeOrder] || 4)
            );
        default:
            return sorted;
    }
}
