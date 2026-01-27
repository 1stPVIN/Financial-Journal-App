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

import { useLanguage } from "@/lib/language-context";

export default function Home() {
  const { t, language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConverter, setShowConverter] = useState(false);

  // Persistent State
  const [currency, setCurrency] = usePersistentState<string>("currency", "SAR");
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
  const [recurringExpenses, setRecurringExpenses] = usePersistentState<RecurringExpense[]>("recurringExpenses", [
    { id: "r1", desc: "Apartment Rent", amount: 4000, categoryId: "c3", dueDateDay: 1, active: true },
    { id: "r2", desc: "Netflix Subscription", amount: 45, categoryId: "c5", dueDateDay: 15, active: true },
  ]);

  const [categories, setCategories] = usePersistentState<Category[]>("categories", [
    { id: "c1", name: "Salary", icon: "Wallet", color: "#047857", type: "income" },
    { id: "c2", name: "Freelance", icon: "Briefcase", color: "#4d7c0f", type: "income" },
    { id: "c3", name: "Housing", icon: "Home", color: "#be123c", type: "expense" },
    { id: "c4", name: "Food", icon: "Utensils", color: "#c2410c", type: "expense" },
    { id: "c5", name: "Lifestyle", icon: "Coffee", color: "#7e22ce", type: "expense" },
    { id: "c6", name: "Emergency Fund", icon: "Safe", color: "#d4a373", type: "savings" },
  ]);

  const [transactions, setTransactions] = usePersistentState<Transaction[]>("transactions", []);

  // Search & Filter State
  // Search & Filter State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date()); // Default to now, but we need to handle hydration if formatting differs
  const [viewMode, setViewMode] = usePersistentState<"monthly" | "yearly">("viewMode", "monthly");

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Parse Transaction Date (ISO 8601 or Legacy)
      const tDate = new Date(t.date);

      let isTimeMatch = false;
      // Valid ISO Date Check (YYYY-MM-DD or similar parsable)
      if (!isNaN(tDate.getTime()) && t.date.includes("-")) {
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
  }, [transactions, currentDate, searchQuery, selectedFilter, viewMode]);

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
    if (viewMode === 'monthly') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return currentDate.getFullYear().toString();
  }, [currentDate, viewMode]);

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
    if (navigator.share) {
      try {
        const res = await fetch(base64Data);
        const blob = await res.blob();
        const file = new File([blob], "receipt", { type: blob.type || "image/png" });
        await navigator.share({
          files: [file],
          title: 'Transaction Document',
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Sharing is not supported on this device/browser.");
    }
  };

  const handleDownload = (base64Data: string) => {
    const link = document.createElement("a");
    link.href = base64Data;
    link.download = "receipt-attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      if (t.type === 'income') acc.income += t.amount;
      else if (t.type === 'expense') acc.expense += t.amount;
      else if (t.type === 'savings') acc.savings += t.amount;
      return acc;
    }, { income: 0, expense: 0, savings: 0 });
  }, [filteredTransactions]);

  const netIncome = totals.income - totals.expense - totals.savings;

  // Calculate Initial Balance from previous periods for the trend line
  const monthlyStartingBalance = useMemo(() => {
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

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  if (!isMounted) return null; // Prevent hydration mismatch by not rendering until client-side

  return (
    <div
      className="min-h-screen transition-colors duration-300 book-container"
    >
      <BookLayout>
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
                  <h1 className="text-2xl md:text-4xl font-serif text-primary mb-1">{t('financialJournal')}</h1>
                  {/* Date Navigation */}
                  <div className="flex items-center gap-6 bg-card/50 backdrop-blur-sm px-6 py-2 rounded-full border border-border shadow-sm">
                    <button
                      onClick={handlePrevDate}
                      className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft size={20} className="rtl:rotate-180" />
                    </button>
                    <span className="text-lg font-medium font-serif min-w-[140px] text-center">
                      {headerDateLabel}
                    </span>
                    <button
                      onClick={handleNextDate}
                      className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight size={20} className="rtl:rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex gap-2 items-center no-print">
                  <div className="flex gap-2 mr-2 rtl:mr-0 rtl:ml-2">
                    {/* Placeholder for future if needed */}
                  </div>

                  <button
                    onClick={toggleRecurringManager}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-black/5"
                    title={t('monthlyCommitments')}
                  >
                    <CalendarClock size={20} />
                  </button>

                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-black/5"
                    title={t('settings')}
                  >
                    <Settings2 size={20} />
                  </button>

                  <ExportMenu
                    transactions={transactions}
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
                          transactions,
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

                  <button
                    onClick={() => setShowConverter(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-black/5"
                    title={t('currencyConverter')}
                  >
                    <Banknote size={20} />
                  </button>

                  <div className="w-[1px] h-6 bg-border mx-1"></div>

                  <button
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    className="bg-secondary text-secondary-foreground px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors shadow-sm"
                    title={t('categories')}
                  >
                    <Tag size={16} />
                    <span className="flex items-center gap-1">{t('categories')}</span>
                  </button>


                  {uiMode === "standard" ? (
                    <button
                      onClick={() => openForm()}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-md glow-primary"
                    >
                      <Plus size={16} />
                      <span>{t('newEntry')}</span>
                    </button>
                  ) : (
                    <div className="flex bg-muted p-1 rounded-full gap-1 shadow-inner">
                      <button
                        onClick={() => openForm('income')}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 hover:bg-background transition-all flex items-center gap-1 hover:shadow-sm glow-emerald"
                      >
                        <Plus size={12} /> {t('income')}
                      </button>
                      <button
                        onClick={() => openForm('expense')}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-700 hover:bg-background transition-all flex items-center gap-1 hover:shadow-sm glow-rose"
                      >
                        <TrendingDown size={12} /> {t('expense')}
                      </button>
                      <button
                        onClick={() => openForm('savings')}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 hover:bg-background transition-all flex items-center gap-1 hover:shadow-sm glow-amber"
                      >
                        <Wallet size={12} /> {t('savings')}
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
                      transactions,
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
                  generatePDF(transactions, {
                    income: totals.income,
                    expense: totals.expense,
                    savings: totals.savings,
                    net: netIncome,
                    currency
                  }, getCategory);
                }}
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
          </AnimatePresence>

          <Dialog open={showRecurringManager} onOpenChange={setShowRecurringManager}>
            <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
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

          <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
            <DialogContent className="max-w-xl w-[95%] max-h-[85vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
              <div className="bg-background rounded-xl shadow-2xl border border-border p-1">
                <CategoryManager
                  categories={categories}
                  onAdd={addCategory}
                  onEdit={editCategory}
                  onDelete={deleteCategory}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showConverter} onOpenChange={setShowConverter}>
            <DialogContent className="sm:max-w-[400px] p-6 border-none bg-background shadow-2xl rounded-2xl">
              <CurrencyConverter />
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
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
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
            />
          </div>

          {/* Transaction Log */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-serif text-primary">{t('transactionLog')}</h2>

              <div className="flex gap-2">
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
                  />
                ))
              )}
            </div>
          </div>
        </div >

        <Dialog open={!!viewingAttachment} onOpenChange={(open) => !open && setViewingAttachment(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <div className="relative bg-background p-4 rounded-lg shadow-xl border border-border">
              <button
                onClick={() => setViewingAttachment(null)}
                className="absolute right-4 top-4 p-1 rounded-full bg-black/10 hover:bg-black/20 text-foreground z-10"
              >
                <X size={16} />
              </button>

              {viewingAttachment && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg overflow-hidden border border-border bg-card text-center">
                    <img src={viewingAttachment} alt="Attachment" className="max-h-[60vh] w-full object-contain mx-auto" />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleDownload(viewingAttachment)}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-secondary/80"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button
                      onClick={() => handleShare(viewingAttachment)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90"
                    >
                      <Share2 size={16} /> Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </BookLayout >

      {/* Mobile Expanding FAB */}
      {
        !(showSettings || showCategoryManager || showRecurringManager || showForm || viewingAttachment) && (
          <div className="md:hidden fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-40 flex flex-col items-end rtl:items-start gap-2">
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
