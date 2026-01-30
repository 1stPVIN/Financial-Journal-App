import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronDown, Paperclip, X, Image as ImageIcon, TrendingUp, TrendingDown, Wallet, Calendar, Coins, Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, Transaction, TransactionType } from "@/lib/types";
import { iconMap, CURRENCIES } from "@/lib/constants";
import { useLanguage } from "@/lib/language-context";
import { DatePicker } from "@/components/DatePicker";
import { uploadFile } from "@/lib/storage";

interface TransactionFormProps {
    categories: Category[];
    onAdd: (t: { type: TransactionType, amount: number, desc: string, categoryId: string, date: string, paymentLink?: string, attachment?: string, currency?: string }) => void;
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

    // New Fields
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [currency, setCurrency] = useState(initialData?.currency || "SAR");

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const currencyRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

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
            setDate(new Date().toISOString().split('T')[0]);
            // Keep previous currency or default
            if (typeof window !== 'undefined') {
                setCurrency(localStorage.getItem("lastUsedCurrency") || localStorage.getItem("currency") || "SAR");
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
            setType(initialData.type);
            setAmount(initialData.amount.toString());
            setDescription(initialData.desc);
            setPaymentLink(initialData.paymentLink || "");
            setAttachment(initialData.attachment || "");
            setSelectedCatId(initialData.categoryId);
            setDate(initialData.date);
            setCurrency(initialData.currency || "SAR");
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
            if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
                setIsCurrencyOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Process file (used by file input, drag-drop, and paste)
    const processFile = async (file: File) => {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            alert(language === 'ar' ? 'نوع الملف غير مدعوم' : 'Unsupported file type');
            return;
        }

        try {
            setIsUploading(true);
            const url = await uploadFile(file);
            setAttachment(url);
        } catch (error) {
            console.error("Upload failed:", error);
            alert(language === 'ar' ? 'فشل رفع الملف' : 'File upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    // Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    // Paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/') || item.type === 'application/pdf') {
                    const file = item.getAsFile();
                    if (file) {
                        processFile(file);
                        break;
                    }
                }
            }
        };

        const form = formRef.current;
        if (form) {
            form.addEventListener('paste', handlePaste);
        }
        return () => {
            if (form) {
                form.removeEventListener('paste', handlePaste);
            }
        };
    }, []);

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
            date: date,
            paymentLink: paymentLink || undefined,
            attachment: attachment || undefined,
            currency: currency
        });

        // Save currency as last used
        localStorage.setItem("lastUsedCurrency", currency);

        // Only clear if not editing
        if (!initialData) {
            setAmount("");
            setDescription("");
            setPaymentLink("");
            setAttachment("");
            setSelectedCatId("");
            // Keep date as today or maybe user wants to add multiple for same day? 
            // Resetting to today seems safest.
            setDate(new Date().toISOString().split('T')[0]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const { t, language } = useLanguage();

    return (
        <Card className="bg-background shadow-2xl border border-border rounded-xl">
            <CardHeader>
                <CardTitle className="text-lg font-serif">{t('newEntry')}</CardTitle>
            </CardHeader>
            <CardContent>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

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
                        {/* Date & Desc */}
                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <DatePicker
                                    value={date}
                                    onChange={setDate}
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    placeholder={t('descriptionPlaceholder')}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Amount & Currency & Category */}
                        <div className="flex gap-4">
                            <div className="flex-1 flex gap-2">
                                <Input
                                    type="number"
                                    placeholder={t('amount')}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="font-mono rtl:text-left flex-1"
                                />
                                {/* Currency Selector */}
                                <div className="relative w-24" ref={currencyRef}>
                                    <div
                                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                        className="h-9 w-full flex items-center justify-between border rounded-md px-2 text-xs cursor-pointer bg-background hover:bg-accent"
                                    >
                                        <span>{currency}</span>
                                        <ChevronDown size={12} className="opacity-50" />
                                    </div>
                                    {isCurrencyOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded shadow-lg z-50 max-h-40 overflow-y-auto w-32">
                                            {CURRENCIES.map(curr => (
                                                <div
                                                    key={curr.code}
                                                    onClick={() => {
                                                        setCurrency(curr.code);
                                                        setIsCurrencyOpen(false);
                                                    }}
                                                    className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer text-xs"
                                                >
                                                    <span>{curr.code}</span>
                                                    <span className="text-muted-foreground">{curr.symbol}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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

                        {/* Drag & Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 text-center",
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : attachment
                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                                        : "border-border hover:border-muted-foreground/50"
                            )}
                        >
                            {attachment ? (
                                <div className="flex items-center justify-center gap-3">
                                    {attachment.startsWith('data:application/pdf') ? (
                                        <FileText size={24} className="text-rose-500" />
                                    ) : (
                                        <ImageIcon size={24} className="text-emerald-500" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {attachment.startsWith('data:application/pdf')
                                            ? (language === 'ar' ? 'ملف PDF مرفق' : 'PDF attached')
                                            : t('attachmentAdded')
                                        }
                                    </span>
                                    <button
                                        type="button"
                                        onClick={removeAttachment}
                                        className="p-1 hover:bg-destructive/10 rounded-full hover:text-destructive transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload size={20} className={cn(isDragging && "text-primary animate-bounce")} />
                                    <p className="text-xs">
                                        {isUploading
                                            ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                                            : (language === 'ar' ? 'اسحب وأفلت أو Ctrl+V للصق' : 'Drag & drop or Ctrl+V to paste')
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground" disabled={!amount || !description || !selectedCatId || isUploading}>
                            <Check className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('recordEntry')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
