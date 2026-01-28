"use client";

import { useState } from "react";
import { RecurringExpense, Category, TransactionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ExternalLink, Calendar, Check, X, Edit2 } from "lucide-react";
import { iconMap } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

interface RecurringExpensesManagerProps {
    expenses: RecurringExpense[];
    categories: Category[];
    onAdd: (expense: Omit<RecurringExpense, "id">) => void;
    onUpdate: (id: string, updates: Partial<RecurringExpense>) => void;
    onDelete: (id: string) => void;
    onProcess: (selectedIds: string[]) => void;
    currency: string;
}

export function RecurringExpensesManager({
    expenses,
    categories,
    onAdd,
    onUpdate,
    onDelete,
    onProcess,
    currency
}: RecurringExpensesManagerProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Form State
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [dueDateDay, setDueDateDay] = useState("1");
    const [paymentLink, setPaymentLink] = useState("");

    const expenseCategories = categories.filter(c => c.type === 'expense');

    const resetForm = () => {
        setDesc("");
        setAmount("");
        setCategoryId("");
        setDueDateDay("1");
        setPaymentLink("");
        setEditingId(null);
    };

    const handleSave = () => {
        if (!desc || !amount || !categoryId || !dueDateDay) return;

        const expenseData = {
            desc,
            amount: parseFloat(amount),
            categoryId,
            dueDateDay: parseInt(dueDateDay),
            paymentLink,
            active: true
        };

        if (editingId) {
            onUpdate(editingId, expenseData);
        } else {
            onAdd(expenseData);
        }

        setIsAddOpen(false);
        resetForm();
    };

    const startEdit = (expense: RecurringExpense) => {
        setDesc(expense.desc);
        setAmount(expense.amount.toString());
        setCategoryId(expense.categoryId);
        setDueDateDay(expense.dueDateDay.toString());
        setPaymentLink(expense.paymentLink || "");
        setEditingId(expense.id);
        setIsAddOpen(true);
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleProcess = () => {
        onProcess(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    const { t } = useLanguage();

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className="text-xl font-serif text-primary">{t('monthlyCommitments')}</h2>
                    <p className="text-sm text-muted-foreground">{t('manageMonthlyBills')}</p>
                </div>
                <Button
                    onClick={() => {
                        if (isAddOpen) {
                            setIsAddOpen(false);
                            resetForm();
                        } else {
                            resetForm();
                            setIsAddOpen(true);
                        }
                    }}
                    className="gap-2 w-full h-9 text-sm"
                    variant={isAddOpen ? "secondary" : "outline"}
                >
                    {isAddOpen ? <X size={14} /> : <Plus size={14} />}
                    {isAddOpen ? t('cancel') : t('addCommitment')}
                </Button>
            </div>

            {/* Inline Form with Animation */}
            {/* Inline Form with Animation */}
            <AnimatePresence>
                {isAddOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="bg-muted/30 border border-border rounded-xl p-4 sm:p-6 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
                                    {editingId ? t('editCommitment') : t('newCommitment')}
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    placeholder={t('descriptionPlaceholder')}
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            placeholder={t('amount')}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="31"
                                            placeholder={t('day')}
                                            title="Day of Month"
                                            value={dueDateDay}
                                            onChange={(e) => setDueDateDay(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {expenseCategories.map(cat => {
                                        const Icon = iconMap[cat.icon] || iconMap["Home"];
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategoryId(cat.id)}
                                                className={cn(
                                                    "flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-all",
                                                    categoryId === cat.id
                                                        ? "border-primary bg-primary/5 text-primary scale-105 shadow-sm"
                                                        : "border-border hover:border-primary/30 hover:bg-background"
                                                )}
                                            >
                                                <Icon size={16} style={{ color: cat.color }} />
                                                <span className="truncate w-full text-center">{cat.name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                                <Input
                                    placeholder={t('paymentLinkOptional')}
                                    value={paymentLink}
                                    onChange={(e) => setPaymentLink(e.target.value)}
                                />

                                <div className="flex justify-end pt-2">
                                    <Button onClick={handleSave} disabled={!desc || !amount || !categoryId || !dueDateDay} className="w-full sm:w-auto">
                                        {editingId ? "Update Commitment" : t('saveCommitment')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {expenses.map((expense) => {
                    const category = categories.find(c => c.id === expense.categoryId);
                    const Icon = category ? (iconMap[category.icon] || iconMap["Home"]) : iconMap["Home"];

                    return (
                        <Card key={expense.id} className={cn(
                            "relative border transition-all cursor-pointer group hover:shadow-md",
                            selectedIds.has(expense.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        )}
                            onClick={() => toggleSelection(expense.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                            selectedIds.has(expense.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        )}>
                                            <span className="font-mono text-xs font-bold">{expense.dueDateDay}</span>
                                        </div>
                                        <div className="font-medium">{expense.desc}</div>
                                    </div>
                                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        {expense.paymentLink && (
                                            <a
                                                href={expense.paymentLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors"
                                                title="Open Payment Link"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEdit(expense); }}
                                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
                                        {category && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Icon size={14} style={{ color: category.color }} />
                                                <span className="text-xs truncate">{category.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-serif text-base font-semibold text-destructive whitespace-nowrap ml-2 rtl:ml-0 rtl:mr-2">
                                        {formatCurrency(expense.amount, currency)}
                                    </div>
                                </div>
                                {selectedIds.has(expense.id) && (
                                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center animate-in zoom-in rtl:left-2 rtl:right-auto">
                                        <Check size={10} className="text-white" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover border shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50"
                    >
                        <span className="text-sm font-medium">{selectedIds.size} {t('selected')}</span>
                        <Button onClick={handleProcess} className="rounded-full bg-primary text-white hover:bg-primary/90">
                            {t('addToLog')}
                        </Button>
                        <button onClick={() => setSelectedIds(new Set())} className="p-1 rounded-full hover:bg-muted">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
