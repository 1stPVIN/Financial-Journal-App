import React from "react";
import { Transaction, Category } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { iconMap } from "@/lib/constants";
import { FilePenLine, Paperclip, CalendarDays, ExternalLink, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface TransactionItemProps {
    transaction: Transaction;
    category?: Category;
    currency: string;
    onEdit: () => void;
    onDelete?: () => void;
    onViewAttachment: () => void;
}

export function TransactionItem({
    transaction,
    category,
    currency,
    onEdit,
    onDelete,
    onViewAttachment
}: TransactionItemProps) {
    const { language } = useLanguage();

    // Get Icon
    const Icon = category?.icon ? iconMap[category.icon as keyof typeof iconMap] : iconMap.HelpCircle;

    // Format Date
    const dateObj = new Date(transaction.date);
    const dateStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })
        : transaction.date;

    return (
        <div className="group flex items-center justify-between p-3 rounded-xl bg-card border border-border/40 hover:border-border hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-3 md:gap-4">
                {/* Icon Box */}
                <div
                    className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white shadow-sm transition-all duration-300"
                    style={{
                        backgroundColor: category?.color || "#94a3b8",
                        boxShadow: `0 0 15px ${category?.color}80` // 80 = 50% opacity
                    }}
                >
                    {Icon ? <Icon size={20} className="md:w-6 md:h-6" /> : <div className="w-5 h-5 bg-white/20 rounded-full" />}
                </div>

                {/* Details */}
                <div className="flex flex-col min-w-0 flex-1 mr-2 rtl:mr-0 rtl:ml-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm md:text-base truncate block max-w-[150px] md:max-w-none">
                            {transaction.desc}
                        </span>

                        <div className="flex items-center gap-1">
                            {transaction.paymentLink && (
                                <a
                                    href={transaction.paymentLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground hover:text-blue-500 transition-colors p-1"
                                    title="Payment Link"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            )}

                            {transaction.attachment && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewAttachment(); }}
                                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                                    title="View Attachment"
                                >
                                    <Paperclip size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            <CalendarDays size={10} />
                            {dateStr}
                        </span>
                        {category && (
                            <span
                                className="px-1.5 py-0.5 rounded-md bg-opacity-10 truncate max-w-[120px] glow-tag transition-all duration-300"
                                style={{ backgroundColor: `${category.color}20`, color: category.color }}
                            >
                                {category.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Amount & Actions */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <span className={cn(
                    "text-sm md:text-base font-bold font-mono whitespace-nowrap transition-all duration-300",
                    transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-500 glow-emerald" :
                        transaction.type === 'expense' ? "text-rose-600 dark:text-rose-500 glow-rose" :
                            "text-amber-600 dark:text-amber-500 glow-amber"
                )}>
                    {transaction.type === 'income' ? "+" : "-"}{Number(transaction.amount).toLocaleString()}
                    <span className="text-[10px] md:text-xs font-normal text-muted-foreground ml-1">{currency}</span>
                </span>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all"
                        aria-label="Edit"
                    >
                        <FilePenLine size={16} />
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-all"
                            aria-label="Delete"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
