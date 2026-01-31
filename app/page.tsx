"use client";

import { useState, useMemo, useEffect } from "react";
import { BookLayout } from "@/components/BookLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks";
import { Plus, TrendingDown, TrendingUp, Wallet, Settings2, X, FilePenLine, CalendarClock, ExternalLink, Paperclip, Share2, Download, Menu, ChevronDown, Tag, Library, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { OverviewChart } from "@/components/OverviewChart";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionItem } from "@/components/TransactionItem";
import { CategoryManager } from "@/components/CategoryManager";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SortDropdown, sortTransactions, SortOption } from "@/components/SortDropdown";
import { ExportMenu } from "@/components/ExportMenu";
import { RecurringExpensesManager } from "@/components/RecurringExpensesManager";
import { Category, Transaction, TransactionType, RecurringExpense } from "@/lib/types";
import { iconMap } from "@/lib/constants";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MobileMenu } from "@/components/MobileMenu";
import { AnimatePresence, motion } from "framer-motion";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { Banknote } from "lucide-react";
import { LockScreen } from "@/components/LockScreen";
import { AttachmentViewer } from "@/components/AttachmentViewer";
import { useExchangeRates } from "@/lib/hooks";

import { useLanguage } from "@/lib/language-context";
import { useSyncedState } from "@/lib/sync-hooks";
import { useSupabase } from "@/components/SupabaseProvider";
import { AuthComponent } from "@/components/AuthComponent";
import { User, LogOut, Cloud, CloudOff, Loader2, CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Need Popover for Auth Menu
import { HelpDialog } from "@/components/HelpDialog";

export default function Home() {
  const { t, language } = useLanguage();
  const { user, signOut, isLoading: isAuthLoading } = useSupabase(); // Get User State
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [isCheckingLock, setIsCheckingLock] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false); // NEW AUTH DIALOG STATE

  // Lock Check Effect
  useEffect(() => {
    const hash = localStorage.getItem("auth_password_hash");
    if (hash) {
      setIsAppLocked(true);
    } else {
      setIsAppLocked(false);
    }
    setIsCheckingLock(false);
  }, []);

  // Persistent State
  const [currency, setCurrency] = usePersistentState<string>("currency", "SAR");
  const { rates } = useExchangeRates(currency);
  const [uiMode, setUiMode] = usePersistentState<"standard" | "simplified">("uiMode", "standard");
  const [salary, setSalary] = usePersistentState<number>("salary", 0);
  const [budget, setBudget] = usePersistentState<number>("budget", 0);

  // Theme State
  const [currentTheme, setCurrentTheme] = usePersistentState<string>("theme", "classic");
  const [isDarkMode, setIsDarkMode] = usePersistentState<boolean>("darkMode", false);

  // Apply theme to documentElement (root)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    console.log(`Theme Changed: ${currentTheme}, Dark: ${isDarkMode}`); // Debug log
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme, isDarkMode]);

  const [defaultFormType, setDefaultFormType] = useState<TransactionType>("expense");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);


  const [showRecurringManager, setShowRecurringManager] = useState(false);

  // SYNCED STATE
  const [recurringExpenses, setRecurringExpenses, isSyncingRecurring] = useSyncedState<RecurringExpense>(
    "recurringExpenses",
    "recurring_expenses",
    [
      { id: "r1", desc: "Apartment Rent", amount: 4000, categoryId: "c3", dueDateDay: 1, active: true },
      { id: "r2", desc: "Netflix Subscription", amount: 45, categoryId: "c5", dueDateDay: 15, active: true },
    ]
  );

  const [categories, setCategories, isSyncingCategories] = useSyncedState<Category>(
    "categories",
    "categories",
    [
      { id: "c1", name: "Salary", icon: "Wallet", color: "#047857", type: "income" },
      { id: "c2", name: "Freelance", icon: "Briefcase", color: "#4d7c0f", type: "income" },
      { id: "c3", name: "Housing", icon: "Home", color: "#be123c", type: "expense" },
      { id: "c4", name: "Food", icon: "Utensils", color: "#c2410c", type: "expense" },
      { id: "c5", name: "Lifestyle", icon: "Coffee", color: "#7e22ce", type: "expense" },
      { id: "c6", name: "Emergency Fund", icon: "Safe", color: "#d4a373", type: "savings" },
    ]
  );

  const [transactions, setTransactions, isSyncingTransactions] = useSyncedState<Transaction>(
    "transactions",
    "transactions",
    []
  );

  const isSyncing = isSyncingCategories || isSyncingTransactions || isSyncingRecurring;

  // Search & Filter State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date()); // Default to now, but we need to handle hydration if formatting differs
  const [viewMode, setViewMode] = usePersistentState<"monthly" | "yearly" | "all">("viewMode", "monthly");
  const [showCommitmentsWidget, setShowCommitmentsWidget] = usePersistentState<boolean>("showCommitmentsWidget", true);
  const [showConverterWidget, setShowConverterWidget] = usePersistentState<boolean>("showConverterWidget", true);

  // Hydration fix: Ensure we only render date-dependent UI after mount if needed, 
  // OR just assume "new Date()" is close enough but formatting might differ. 
  // A better approach for "Financial Journal" is to default to current client date.
  // But to avoid "Hydration failed", we can suppress warning on the specific element OR use a two-pass render.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);


  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");

  // Move getCategory here so it's available for filteredTransactions
  const getCategory = (id: string) => categories.find(c => c.id === id);

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(t => {
      // 1. Parse Transaction Date (ISO 8601 or Legacy)
      const tDate = new Date(t.date);

      let isTimeMatch = false;

      if (viewMode === 'all') {
        isTimeMatch = true;
      } else if (!isNaN(tDate.getTime()) && t.date.includes("-")) {
        // Valid ISO Date Check (YYYY-MM-DD or similar parsable)
        if (viewMode === 'monthly') {
          isTimeMatch =
            tDate.getMonth() === currentDate.getMonth() &&
            tDate.getFullYear() === currentDate.getFullYear();
        } else {
          // Yearly Mode
          isTimeMatch = tDate.getFullYear() === currentDate.getFullYear();
        }
      } else {
        // Fallback for legacy
        if (viewMode === 'monthly') {
          const monthShort = currentDate.toLocaleDateString('en-US', { month: 'short' });
          isTimeMatch = t.date.includes(monthShort) && t.date.includes(currentDate.getFullYear().toString());
        } else {
          isTimeMatch = t.date.includes(currentDate.getFullYear().toString());
        }
      }

      const matchesSearch = t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((t as any).category && (t as any).category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (getCategory(t.categoryId)?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedFilter === "all" ||
        (t as any).category === selectedFilter ||
        t.categoryId === selectedFilter;

      return isTimeMatch && matchesSearch && matchesCategory;
    });

    // Apply sorting
    return sortTransactions(filtered, sortBy, (id) => getCategory(id)?.name || "");
  }, [transactions, currentDate, searchQuery, selectedFilter, viewMode, sortBy]);

  // Navigation Handlers
  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'monthly') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'monthly') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  // Format Header Date
  const headerDateLabel = useMemo(() => {
    if (viewMode === 'all') return t('allTime');
    if (viewMode === 'monthly') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return currentDate.getFullYear().toString();
  }, [currentDate, viewMode, t]);

  const handleTransactionSubmit = (data: { type: TransactionType, amount: number, desc: string, categoryId: string, date: string, paymentLink?: string, attachment?: string }) => {
    if (editingTransaction) {

      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, ...data } : t));
      setEditingTransaction(null);
    } else {
      setTransactions(prev => [{ ...data, id: Math.random() }, ...prev]);
    }
    setShowForm(false);
  };

  const handleShare = async (base64Data: string) => {
    try {
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const mimeType = blob.type;
      const extension = mimeType === "application/pdf" ? ".pdf" : ".png";
      const file = new File([blob], `attachment${extension}`, { type: mimeType });

      // Check if Web Share API is available and can share files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: language === 'ar' ? 'مستند المعاملة' : 'Transaction Document',
        });
      } else {
        // Fallback: Download the file instead
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attachment${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Show message
        alert(language === 'ar'
          ? 'تم تحميل الملف. يمكنك مشاركته يدوياً.'
          : 'File downloaded. You can share it manually.');
      }
    } catch (err) {
      console.error("Error sharing:", err);
      // Fallback to download
      handleDownload(base64Data);
    }
  };

  // Helper: Convert Base64 to Blob
  const base64ToBlob = (base64: string, type: string = 'application/pdf') => {
    if (!base64.startsWith('data:')) return new Blob([], { type });
    const binStr = atob(base64.split(',')[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type: type });
  };

  const handleDownload = async (attachment: string) => {
    try {
      if (attachment.startsWith('data:')) {
        const link = document.createElement("a");
        link.href = attachment;
        link.download = attachment.startsWith("data:application/pdf") ? "document.pdf" : "attachment.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // It is a URL (Telegram)
        const res = await fetch(attachment);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = blob.type === 'application/pdf' ? "document.pdf" : "attachment.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Download failed", e);
      window.open(attachment, '_blank');
    }
  };

  // Recurring Logic
  const addRecurring = (expense: Omit<RecurringExpense, "id">) => {
    setRecurringExpenses(prev => [...prev, { ...expense, id: Math.random().toString() }]);
  };

  const updateRecurring = (id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(e => e.id !== id));
  };

  const processRecurring = (selectedIds: string[]) => {
    const toAdd = recurringExpenses.filter(e => selectedIds.includes(e.id));
    const today = new Date().toISOString().split('T')[0];

    const newTransactions = toAdd.map(e => ({
      id: Math.random(),
      date: today,
      desc: e.desc,
      categoryId: e.categoryId,
      amount: e.amount,
      type: "expense" as TransactionType,
      paymentLink: e.paymentLink
    }));

    setTransactions(prev => [...newTransactions, ...prev]);
    setShowRecurringManager(false);
  };

  const addCategory = (cat: Category) => {
    setCategories(prev => [...prev, cat]);
  };

  const editCategory = (cat: Category) => {
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const openForm = (type: TransactionType = "expense") => {
    setDefaultFormType(type);
    setEditingTransaction(null);
    setShowForm(true);
    setShowRecurringManager(false);
    setShowCategoryManager(false);
  };

  const toggleRecurringManager = () => {
    setShowRecurringManager(!showRecurringManager);
    setShowForm(false);
    setShowCategoryManager(false);
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setShowForm(true);
  };

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      let amount = t.amount;
      // Convert if needed
      if (t.currency && t.currency !== currency && rates && rates[t.currency]) {
        amount = t.amount / rates[t.currency];
      }

      if (t.type === 'income') acc.income += amount;
      else if (t.type === 'expense') acc.expense += amount;
      else if (t.type === 'savings') acc.savings += amount;
      return acc;
    }, { income: 0, expense: 0, savings: 0 });
  }, [filteredTransactions, currency, rates]);

  const netIncome = totals.income - totals.expense - totals.savings;

  // Calculate Initial Balance from previous periods for the trend line
  const monthlyStartingBalance = useMemo(() => {
    if (viewMode === 'all') return 0;
    // Start of the current view period
    let startDate: Date;
    if (viewMode === 'monthly') {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    } else {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
    }

    return transactions.reduce((acc, t) => {
      const tDate = new Date(t.date);
      // Valid date check
      if (isNaN(tDate.getTime())) return acc;

      // If transaction is BEFORE the current period, add to starting balance
      if (tDate < startDate) {
        const val = t.type === 'income' ? t.amount : (t.type === 'expense' ? -t.amount : 0);
        if (t.type === 'savings') {
          return acc - t.amount;
        } else {
          return acc + val;
        }
      }
      return acc;
    }, 0);
  }, [transactions, currentDate, viewMode]);

  // Aggregate data for chart
  const chartData = [
    { name: "Prev", income: 11000, expense: 8000 },
    { name: "Curr", income: totals.income, expense: totals.expense + totals.savings },
  ];


  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Conditional Returns must be at the END of hooks
  if (isCheckingLock || !isMounted) {
    return <div className="min-h-screen bg-background" />; // Simple loading state
  }

  if (isAppLocked) {
    return <LockScreen onUnlock={() => setIsAppLocked(false)} />;
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300 book-container"
    >
      <BookLayout>
        {/* Desktop Sidebar Widgets */}
        {(showCommitmentsWidget || showConverterWidget) && (
          <div className="hidden xl:flex flex-col gap-6 fixed top-10 left-8 w-[340px] h-[calc(100vh-5rem)] overflow-y-auto z-10 p-2 scrollbar-none rtl:left-auto rtl:right-8 transition-all duration-500 ease-in-out">
            {/* Currency Converter */}
            {showConverterWidget && (
              <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl p-5 hover:shadow-2xl hover:border-primary/30 transition-all duration-300">
                <CurrencyConverter />
              </div>
            )}

            {/* Monthly Commitments */}
            {showCommitmentsWidget && (
              <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl p-5 hover:shadow-2xl hover:border-primary/30 transition-all duration-300">
                <RecurringExpensesManager
                  expenses={recurringExpenses}
                  categories={categories}
                  onAdd={addRecurring}
                  onUpdate={updateRecurring}
                  onDelete={deleteRecurring}
                  onProcess={processRecurring}
                  currency={currency}
                />
              </div>
            )}
          </div>
        )}

        <div id="dashboard-snapshot" className="bg-background pt-4 px-1 rounded-xl">
          {/* Responsive Header */}
          <header className="mb-6 md:mb-8 border-b border-dashed border-primary/20 pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 text-primary hover:bg-muted rounded-full transition-colors no-print order-first md:order-none"
                >
                  {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div>
                  <h1 className="text-xl md:text-2xl font-serif text-primary mb-1">{t('financialJournal')}</h1>
                  {/* Date Navigation */}
                  <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm px-1.5 py-1 rounded-full border border-border shadow-sm min-h-[32px] w-fit">
                    {viewMode !== 'all' && (
                      <button
                        onClick={handlePrevDate}
                        className="p-0.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ChevronLeft size={16} className="rtl:rotate-180" />
                      </button>
                    )}
                    <span className="text-xs md:text-sm font-medium font-serif px-2">
                      {headerDateLabel}
                    </span>
                    {viewMode !== 'all' && (
                      <button
                        onClick={handleNextDate}
                        className="p-0.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight size={16} className="rtl:rotate-180" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex gap-1 items-center no-print">
                  <div className="flex gap-1 mr-1 rtl:mr-0 rtl:ml-1">
                    {/* SYNC / AUTH STATUS */}
                    {user ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowAuthDialog(true)}
                          className="flex items-center gap-1 px-1 py-1 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
                          title={user.email || "Profile"}
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            {user.email?.[0].toUpperCase()}
                          </div>
                          {/* Email hidden to save space, visible on hover via title */}
                        </button>

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-medium">
                          {isSyncing ? <Loader2 size={10} className="animate-spin" /> : <Cloud size={10} />}
                          <span className="hidden xl:inline">{isSyncing ? "Syncing..." : "Synced"}</span>
                        </div>
                      </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors">
                            <CloudOff size={14} />
                            <span>Login</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <AuthComponent onAuthSuccess={() => { }} />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Widgets removed from header as requested, now inline */}

                  {/* Widgets removed from header as requested, now inline */}
                  <button
                    onClick={() => setShowHelp(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-black/5"
                    title={t('helpCenter')}
                  >
                    <CircleHelp size={20} />
                  </button>

                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-black/5"
                    title={t('settings')}
                  >
                    <Settings2 size={20} />
                  </button>

                  <ExportMenu
                    transactions={filteredTransactions}
                    summary={{
                      income: totals.income,
                      expense: totals.expense,
                      savings: totals.savings,
                      net: netIncome,
                      currency
                    }}
                    getCategory={getCategory}
                    onExportExcel={() => {
                      import("@/lib/export").then(mod => {
                        mod.exportToExcel({
                          transactions: filteredTransactions,
                          summary: {
                            income: totals.income,
                            expense: totals.expense,
                            savings: totals.savings,
                            net: netIncome,
                            currency
                          },
                          categoryLookup: (id) => getCategory(id)?.name || "Uncategorized"
                        });
                      });
                    }}
                  />

                  {/* Widgets removed from header as requested, now inline */}
                  {/* Divider removed as requested */}

                  <button
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    className="bg-secondary text-secondary-foreground p-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors shadow-sm"
                    title={t('categories')}
                  >
                    <Tag size={16} />
                  </button>

                  {/* Fallback Buttons for Disabled Widgets */}
                  {!showCommitmentsWidget && (
                    <button
                      onClick={() => setShowRecurringManager(true)}
                      className="bg-secondary text-secondary-foreground p-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors shadow-sm"
                      title={t('monthlyCommitments')}
                    >
                      <CalendarClock size={16} />
                    </button>
                  )}

                  {!showConverterWidget && (
                    <button
                      onClick={() => setShowConverter(true)}
                      className="bg-secondary text-secondary-foreground p-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors shadow-sm"
                      title="Currency Converter"
                    >
                      <Banknote size={16} />
                    </button>
                  )}


                  {uiMode === "standard" ? (
                    <button
                      onClick={() => openForm()}
                      className="bg-primary text-primary-foreground px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium flex items-center gap-2 transition-all shadow-md glow-primary whitespace-nowrap"
                      title={t('newEntry')}
                    >
                      <Plus size={16} />
                      <span className="hidden lg:inline">{t('newEntry')}</span>
                    </button>
                  ) : (
                    <div className="flex bg-muted p-0.5 rounded-full gap-0.5 shadow-inner shrink-0">
                      <button
                        onClick={() => openForm('income')}
                        className="px-2 py-1 rounded-full text-[10px] lg:text-xs font-semibold text-emerald-700 hover:bg-background transition-all flex items-center gap-1 hover:shadow-sm glow-emerald whitespace-nowrap"
                      >
                        <Plus size={10} /> {t('income')}
                      </button>
                      <button
                        onClick={() => openForm('expense')}
                        className="px-2 py-1 rounded-full text-[10px] lg:text-xs font-semibold text-rose-700 hover:bg-background transition-all flex items-center gap-1 hover:shadow-sm glow-rose whitespace-nowrap"
                      >
                        <TrendingDown size={10} /> {t('expense')}
                      </button>
                      <button
                        onClick={() => openForm('savings')}
                        className="px-2 py-1 rounded-full text-[10px] lg:text-xs font-semibold text-amber-700 hover:bg-background transition-all flex items-center gap-1 hover:shadow-sm glow-amber whitespace-nowrap"
                      >
                        <Wallet size={10} /> {t('savings')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Sidebar Overlay */}
              {/* Mobile Sidebar Overlay */}
              <MobileMenu
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
                onOpenRecurring={() => toggleRecurringManager()}
                onOpenCategories={() => setShowCategoryManager(true)}
                onOpenSettings={() => setShowSettings(true)}
                onOpenConverter={() => setShowConverter(true)}
                onExportExcel={() => {
                  import("@/lib/export").then(mod => {
                    mod.exportToExcel({
                      transactions: filteredTransactions,
                      summary: {
                        income: totals.income,
                        expense: totals.expense,
                        savings: totals.savings,
                        net: netIncome,
                        currency
                      },
                      categoryLookup: (id) => getCategory(id)?.name || "Uncategorized"
                    });
                  });
                }}
                onExportPDF={async () => {
                  const { generatePDF } = await import("@/lib/pdf-generator");
                  generatePDF(filteredTransactions, {
                    income: totals.income,
                    expense: totals.expense,
                    savings: totals.savings,
                    net: netIncome,
                    currency
                  }, getCategory);
                }}
                user={user}
                onSignOut={() => {
                  if (window.confirm(language === 'ar' ? "هل أنت متأكد من تسجيل الخروج؟" : "Are you sure you want to sign out?")) {
                    signOut();
                  }
                }}
                onLogin={() => setShowAuthDialog(true)}
                onOpenHelp={() => setShowHelp(true)}
              />

            </div>
          </header>

          <AnimatePresence>
            {showSettings && (
              <SettingsDialog
                currentCurrency={currency}
                onCurrencyChange={setCurrency}
                uiMode={uiMode}
                onUiModeChange={setUiMode}
                salary={salary}
                onSalaryChange={setSalary}
                budget={budget}
                onBudgetChange={setBudget}
                onClose={() => setShowSettings(false)}
                currentTheme={currentTheme}
                onThemeChange={setCurrentTheme}
                isDarkMode={isDarkMode}
                onDarkModeChange={setIsDarkMode}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showCommitmentsWidget={showCommitmentsWidget}
                onShowCommitmentsWidgetChange={setShowCommitmentsWidget}
                showConverterWidget={showConverterWidget}
                onShowConverterWidgetChange={setShowConverterWidget}
                transactions={transactions}
                categories={categories}
                recurringExpenses={recurringExpenses}
                onReset={() => {
                  // SettingsDialog handles the confirmation and safety backup.
                  // We just need to wipe data but PRESERVE the backup we just made.
                  const backup = localStorage.getItem("last_auto_backup");
                  localStorage.clear();
                  if (backup) {
                    localStorage.setItem("last_auto_backup", backup);
                  }
                  window.location.reload();
                }}
              />
            )}
            {showHelp && (
              <HelpDialog
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
              />
            )}
          </AnimatePresence>


          {/* Dashboard Widgets Section (Inline) */}
          {/* Dashboard Widgets Section (Inline - Mobile/Laptop) */}
          {(showCommitmentsWidget || showConverterWidget) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 xl:hidden">
              {showCommitmentsWidget && (
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 shadow-sm">
                  <RecurringExpensesManager
                    expenses={recurringExpenses}
                    categories={categories}
                    onAdd={addRecurring}
                    onUpdate={updateRecurring}
                    onDelete={deleteRecurring}
                    onProcess={processRecurring}
                    currency={currency}
                  />
                </div>
              )}
              {showConverterWidget && (
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm h-fit">
                  <CurrencyConverter />
                </div>
              )}
            </div>
          )}

          <Dialog open={showRecurringManager} onOpenChange={setShowRecurringManager}>
            <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
              {/* Kept for backward compat or if opened via other means, though largely redundant if inline */}
              <div className="bg-background rounded-xl shadow-2xl border border-border p-6">
                <RecurringExpensesManager
                  expenses={recurringExpenses}
                  categories={categories}
                  onAdd={addRecurring}
                  onUpdate={updateRecurring}
                  onDelete={deleteRecurring}
                  onProcess={processRecurring}
                  currency={currency}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showConverter} onOpenChange={setShowConverter}>
            <DialogContent className="sm:max-w-[400px] p-6 border-none bg-background shadow-2xl rounded-2xl">
              <CurrencyConverter />
            </DialogContent>
          </Dialog>


          <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
            <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
              <div className="bg-background rounded-xl shadow-2xl border border-border p-6">
                <CategoryManager
                  categories={categories}
                  onAdd={addCategory}
                  onEdit={editCategory}
                  onDelete={deleteCategory}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showForm} onOpenChange={(open) => {
            if (!open) {
              setShowForm(false);
              setEditingTransaction(null);
            }
          }}>
            <DialogContent className="sm:max-w-[500px] p-0 border-none bg-transparent shadow-none">
              <TransactionForm
                onAdd={handleTransactionSubmit}
                categories={categories}
                defaultType={defaultFormType}
                initialData={editingTransaction}
              />
            </DialogContent>
          </Dialog>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-5">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow card-hover-glow relative overflow-hidden group">
              <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={48} className={netIncome >= 0 ? "text-emerald-500" : "text-rose-500"} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('netBalance')}</p>
                <h2 className={cn("text-3xl font-bold font-mono tracking-tight", netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400 glow-emerald" : "text-rose-600 dark:text-rose-400 glow-rose")}>
                  {netIncome >= 0 ? "+" : ""}{netIncome.toLocaleString()} <span className="text-base font-normal text-muted-foreground">{currency}</span>
                </h2>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t('savings')} ({totals.income > 0 ? ((totals.savings / totals.income) * 100).toFixed(0) : 0}%)</span>
                  <span className="font-medium mono text-amber-600 glow-amber">{totals.savings.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Available for savings (Net)</span>
                  <span className={cn("font-medium mono", netIncome > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                    {/* Assuming Net Balance is what affects savings potential */}
                    {netIncome.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Income Card Re-Correction */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow card-hover-glow">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('totalIncome')}</p>
                <h2 className="text-3xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 glow-emerald">
                  {totals.income.toLocaleString()} <span className="text-base font-normal text-muted-foreground">{currency}</span>
                </h2>
              </div>
              {budget > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t('ofBudget')}</span>
                    <span className="font-medium">{Math.min(100, Math.round((totals.expense / budget) * 100))}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", (totals.expense / budget) > 1 ? "bg-rose-500" : "bg-primary")}
                      style={{ width: `${Math.min(100, (totals.expense / budget) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {salary > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{Math.round((totals.income / salary) * 100)}% {t('ofGoal')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 glow-box"
                      style={{ width: `${Math.min(100, (totals.income / salary) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Expenses Card */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow card-hover-glow">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('expense')}</p>
                <h2 className="text-3xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 glow-rose">
                  {totals.expense.toLocaleString()} <span className="text-base font-normal text-muted-foreground">{currency}</span>
                </h2>
              </div>
            </div>
          </div>

          {/* Charts & Graphs */}
          <div className="mb-10 no-print">
            <OverviewChart
              transactions={filteredTransactions}
              currency={currency}
              startingBalance={monthlyStartingBalance}
              getCategory={getCategory}
              viewMode={viewMode}
              rates={rates}
            />
          </div>

          {/* Transaction Log */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-serif text-primary">{t('transactionLog')}</h2>

              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rtl:pr-9 rtl:pl-3 pr-4 py-2 bg-background border border-input rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
                  />
                </div>

                <CategoryFilter
                  categories={categories}
                  selectedFilter={selectedFilter}
                  onSelect={setSelectedFilter}
                />

                <SortDropdown
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-border border-dashed">
                  <p>{t('noEntries')}</p>
                  <button onClick={() => openForm()} className="mt-4 text-primary hover:underline">{t('newEntry')}</button>
                </div>
              ) : (
                filteredTransactions.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    category={getCategory(t.categoryId)}
                    currency={currency}
                    onEdit={() => handleEditClick(t)}
                    onDelete={() => setTransactions(prev => prev.filter(tr => tr.id !== t.id))}
                    onViewAttachment={() => setViewingAttachment(t.attachment || null)}
                    onShareAttachment={t.attachment ? () => handleShare(t.attachment!) : undefined}
                    onDownloadAttachment={t.attachment ? () => handleDownload(t.attachment!) : undefined}
                    exchangeRate={rates && t.currency && t.currency !== currency ? rates[t.currency] : undefined}
                    showYear={viewMode === 'all'}
                  />
                ))
              )}
            </div>
          </div>
        </div >

        <Dialog open={!!viewingAttachment} onOpenChange={(open) => !open && setViewingAttachment(null)}>
          <DialogContent className="max-w-[100vw] h-[100vh] w-[100vw] p-0 border-none bg-transparent shadow-none">
            {viewingAttachment && (
              <AttachmentViewer
                src={viewingAttachment}
                onClose={() => setViewingAttachment(null)}
                onDownload={() => handleDownload(viewingAttachment)}
                onShare={() => handleShare(viewingAttachment)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Auth Dialog */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="w-full max-w-md p-0 border-none bg-transparent shadow-none">
            <div className="bg-background rounded-xl border border-border overflow-hidden p-1">
              <AuthComponent onAuthSuccess={() => setShowAuthDialog(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </BookLayout >

      {/* Mobile Expanding FAB */}
      {
        !(showSettings || showCategoryManager || showRecurringManager || showForm || viewingAttachment) && (
          <div className="md:hidden fixed bottom-6 right-6 z-40 flex flex-col items-end rtl:items-start gap-2">
            {/* Options (appear when expanded) with AnimatePresence for smooth exit */}
            <AnimatePresence>
              {showQuickAdd && (
                <>
                  {/* Savings Button */}
                  <motion.button
                    key="savings-btn"
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ duration: 0.2, delay: 0 }}
                    onClick={() => { openForm('savings'); setShowQuickAdd(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full shadow-lg font-medium text-sm whitespace-nowrap glow-amber"
                  >
                    <span>{t('savings')}</span> <div className="p-1 bg-white/50 rounded-full"><Wallet size={16} /></div>
                  </motion.button>

                  {/* Expense Button */}
                  <motion.button
                    key="expense-btn"
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    onClick={() => { openForm('expense'); setShowQuickAdd(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-800 rounded-full shadow-lg font-medium text-sm whitespace-nowrap glow-rose"
                  >
                    <span>{t('expense')}</span> <div className="p-1 bg-white/50 rounded-full"><TrendingDown size={16} /></div>
                  </motion.button>

                  {/* Income Button */}
                  <motion.button
                    key="income-btn"
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    onClick={() => { openForm('income'); setShowQuickAdd(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full shadow-lg font-medium text-sm whitespace-nowrap glow-emerald"
                  >
                    <span>{t('income')}</span> <div className="p-1 bg-white/50 rounded-full"><Plus size={16} /></div>
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Main Toggle Button with rotation animation */}
            <motion.button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              animate={{ rotate: showQuickAdd ? 45 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={cn(
                "w-14 h-14 rounded-full shadow-xl flex items-center justify-center glow-primary",
                showQuickAdd ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
              )}
            >
              <Plus size={28} />
            </motion.button>
          </div>
        )
      }
    </div >
  );
}
