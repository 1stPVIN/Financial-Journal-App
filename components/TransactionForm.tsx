import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronDown, Paperclip, X, Image as ImageIcon, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, Transaction, TransactionType } from "@/lib/types";
import { iconMap } from "@/lib/constants";
import { useLanguage } from "@/lib/language-context";

interface TransactionFormProps {
    categories: Category[];
    onAdd: (t: { type: TransactionType, amount: number, desc: string, categoryId: string, date: string, paymentLink?: string, attachment?: string }) => void;
    defaultType?: TransactionType;
    initialData?: Transaction | null;
}

export function TransactionForm({ onAdd, categories, defaultType = "expense", initialData }: TransactionFormProps) {
    const [type, setType] = useState<TransactionType>(initialData?.type || defaultType);
    const [amount, setAmount] = useState(initialData?.amount.toString() || "");
    const [description, setDescription] = useState(initialData?.desc || "");
    const [paymentLink, setPaymentLink] = useState(initialData?.paymentLink || "");
    const [attachment, setAttachment] = useState(initialData?.attachment || "");
    const [selectedCatId, setSelectedCatId] = useState(initialData?.categoryId || "");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter categories by selected type
    const availableCategories = categories.filter(c => c.type === type);
    const selectedCategory = categories.find(c => c.id === selectedCatId);
    const SelectedIcon = selectedCategory ? (iconMap[selectedCategory.icon] || iconMap["Home"]) : null;

    useEffect(() => {
        if (!initialData) {
            setType(defaultType);
            setAmount("");
            setDescription("");
            setPaymentLink("");
            setAttachment("");
            setSelectedCatId("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
            setType(initialData.type);
            setAmount(initialData.amount.toString());
            setDescription(initialData.desc);
            setPaymentLink(initialData.paymentLink || "");
            setAttachment(initialData.attachment || "");
            setSelectedCatId(initialData.categoryId);
        }
    }, [initialData, defaultType]);

    useEffect(() => {
        // Only reset if NOT editing (initialData is null) and type changes mismatching category
        if (!initialData && selectedCategory && selectedCategory.type !== type) {
            setSelectedCatId("");
        }
    }, [type, selectedCategory, initialData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = () => {
        setAttachment("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !selectedCatId) return;

        onAdd({
            type,
            amount: parseFloat(amount),
            desc: description,
            categoryId: selectedCatId,
            // Save as ISO String (YYYY-MM-DD) for correct filtering
            date: initialData?.date || new Date().toISOString().split('T')[0],
            paymentLink: paymentLink || undefined,
            attachment: attachment || undefined
        });

        // Only clear if not editing, or maybe clear anyway? Usually clear.
        if (!initialData) {
            setAmount("");
            setDescription("");
            setPaymentLink("");
            setAttachment("");
            setSelectedCatId("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const { t } = useLanguage();

    return (
        <Card className="bg-background shadow-2xl border border-border rounded-xl">
            <CardHeader>
                <CardTitle className="text-lg font-serif">{t('newEntry')}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Type Selector */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setType("income")}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                                type === "income"
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600 ring-1 ring-emerald-600"
                                    : "bg-card border-border hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-full mb-2",
                                type === "income" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            )}>
                                <TrendingUp size={20} />
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                type === "income" ? "text-emerald-800 dark:text-emerald-300" : "text-muted-foreground"
                            )}>{t('income')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                                type === "expense"
                                    ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600 ring-1 ring-rose-600"
                                    : "bg-card border-border hover:border-rose-300 hover:bg-rose-50/30 dark:hover:bg-rose-900/20"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-full mb-2",
                                type === "expense" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            )}>
                                <TrendingDown size={20} />
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                type === "expense" ? "text-rose-800 dark:text-rose-300" : "text-muted-foreground"
                            )}>{t('expense')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setType("savings")}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                                type === "savings"
                                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-600 ring-1 ring-amber-600"
                                    : "bg-card border-border hover:border-amber-300 hover:bg-amber-50/30 dark:hover:bg-amber-900/20"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-full mb-2",
                                type === "savings" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                                <Wallet size={20} />
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                type === "savings" ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground"
                            )}>{t('savings')}</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Input
                                placeholder={t('descriptionPlaceholder')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    placeholder={t('amount')}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="font-mono rtl:text-left"
                                />
                            </div>
                            <div className="flex-1 relative" ref={dropdownRef}>
                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={cn(
                                        "flex h-9 w-full items-center justify-between border-b border-input bg-transparent px-3 py-1 text-base md:text-sm cursor-pointer",
                                        !selectedCatId && "text-muted-foreground"
                                    )}
                                >
                                    {selectedCategory ? (
                                        <div className="flex items-center gap-2">
                                            <SelectedIcon size={14} style={{ color: selectedCategory.color }} />
                                            <span>{selectedCategory.name}</span>
                                        </div>
                                    ) : (
                                        <span>{t('selectCategory')}</span>
                                    )}
                                    <ChevronDown size={14} className="opacity-50" />
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded shadow-lg z-50 max-h-60 overflow-y-auto rtl:right-auto rtl:left-0">
                                        {availableCategories.length === 0 ? (
                                            <div className="p-3 text-xs text-muted-foreground text-center italic">
                                                {t('noCategoriesFor')} ({t(type)}). <br /> {t('addInSettings')}
                                            </div>
                                        ) : (
                                            availableCategories.map((cat) => {
                                                const Icon = iconMap[cat.icon] || iconMap["Home"];
                                                return (
                                                    <div
                                                        key={cat.id}
                                                        onClick={() => {
                                                            setSelectedCatId(cat.id);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                                                    >
                                                        <Icon size={14} style={{ color: cat.color }} />
                                                        <span className="text-sm">{cat.name}</span>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    placeholder={t('paymentLinkOptional')}
                                    value={paymentLink}
                                    onChange={(e) => setPaymentLink(e.target.value)}
                                    className="text-xs font-mono text-muted-foreground"
                                />
                            </div>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    title={t('attachFile')}
                                    className={cn("w-10 h-10", attachment ? "border-primary text-primary" : "")}
                                >
                                    <Paperclip size={16} />
                                </Button>
                            </div>
                        </div>

                        {attachment && (
                            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-secondary text-xs text-muted-foreground">
                                <ImageIcon size={14} />
                                <span className="flex-1 truncate">{t('attachmentAdded')}</span>
                                <button type="button" onClick={removeAttachment} className="hover:text-destructive">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground" disabled={!amount || !description || !selectedCatId}>
                            <Check className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('recordEntry')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
