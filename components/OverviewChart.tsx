"use client";

import { useState, useMemo } from "react";
import {
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
    LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid, ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Transaction, Category } from "@/lib/types";
import { BarChart3, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface ChartData {
    name: string;
    income: number;
    expense: number;
    balance?: number; // Accumulated balance
}


interface OverviewChartProps {
    transactions: Transaction[];
    currency: string;
    startingBalance?: number;
    getCategory?: (id: string) => Category | undefined;
    viewMode: "monthly" | "yearly" | "all";
}

const COLORS = ['#047857', '#be123c', '#d4a373', '#1d4ed8', '#7e22ce', '#c2410c'];

export function OverviewChart({ transactions, currency = "SAR", startingBalance = 0, getCategory, viewMode }: OverviewChartProps) {
    const [chartType, setChartType] = useState<"bar" | "trend" | "pie">("bar");

    const data = useMemo(() => {
        if (!transactions) return [];

        if (viewMode === 'all') {
            // Aggregate by Year
            const yearlyMap = new Map<number, { name: string, income: number, expense: number }>();

            transactions.forEach(t => {
                const d = new Date(t.date);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear();
                    if (!yearlyMap.has(year)) {
                        yearlyMap.set(year, {
                            name: year.toString(),
                            income: 0,
                            expense: 0
                        });
                    }
                    const entry = yearlyMap.get(year)!;
                    if (t.type === 'income') entry.income += t.amount;
                    if (t.type === 'expense') entry.expense += t.amount;
                }
            });

            return Array.from(yearlyMap.values()).sort((a, b) => parseInt(a.name) - parseInt(b.name));
        }

        if (viewMode === 'yearly') {
            // Aggregate by Month (0-11)
            const monthlyData = Array.from({ length: 12 }, (_, i) => ({
                name: new Date(0, i).toLocaleString('default', { month: 'short' }),
                income: 0,
                expense: 0,
                monthIndex: i
            }));

            transactions.forEach(t => {
                const d = new Date(t.date);
                if (!isNaN(d.getTime())) {
                    const month = d.getMonth();
                    if (t.type === 'income') monthlyData[month].income += t.amount;
                    if (t.type === 'expense') monthlyData[month].expense += t.amount;
                }
            });

            return monthlyData;
        }

        // Monthly View (Original Logic)
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

        return [
            {
                name: "Current",
                income: totalIncome,
                expense: totalExpense
            }
        ];
    }, [transactions, viewMode]);

    // Calculate Trend Line Data
    const balanceTrendData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        let runningBalance = startingBalance || 0;

        // 1. Sort transactions by date/time
        // Assuming date string is ISO or comparable.
        // If date includes time, sorting is accurate. If only YYYY-MM-DD, order is preserved as added or arbitrary.
        // Better to trust the order if they are already sorted or sort strictly.
        // Let's sort by date string.
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. Map every transaction to a point in the chart
        // We do NOT group by day anymore, to show intraday movement.
        const points = sortedTransactions.map((t, index) => {
            const val = t.type === 'income' ? t.amount : (t.type === 'expense' ? -t.amount : 0);

            if (t.type === 'savings') {
                // Savings acts as expense for "Net Balance" typically
                runningBalance -= t.amount;
            } else {
                runningBalance += val;
            }

            // Recharts needs unique 'name' (XKey) for correct tooltip behavior on identical dates
            return {
                name: `${t.date}__${index}`,
                displayDate: t.date,
                balance: runningBalance,
                desc: t.desc,
                amount: t.amount,
                type: t.type
            };
        });

        return points;
    }, [transactions, startingBalance]);

    // Calculate Expense Breakdown for Pie
    const expenseBreakdown = useMemo(() => {
        if (!transactions) return [];
        const expenseMap: Record<string, number> = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            // Use categoryId from type, but fallback to 'category' for legacy/loose typing if needed
            // The type definition says 'categoryId'.
            const catId = (t as any).categoryId || (t as any).category;
            const catName = getCategory ? (getCategory(catId)?.name || "Uncategorized") : (catId || "Uncategorized");
            expenseMap[catName] = (expenseMap[catName] || 0) + t.amount;
        });
        return Object.keys(expenseMap).map(k => ({ name: k, value: expenseMap[k] }));
    }, [transactions, getCategory]);


    const { t, language } = useLanguage();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            // 1. Trend Chart (Transaction Data)
            if (data.balance !== undefined) {
                return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm rtl:text-right">
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-lg font-mono tracking-tight text-primary">
                                {currency} {data.balance.toLocaleString()}
                            </span>
                            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground border-t border-border/50 pt-2 mt-1">
                                <span>{data.displayDate || data.name}</span>
                                {data.type && (
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded uppercase text-[10px] font-bold",
                                        data.type === 'income' ? "bg-emerald-500/10 text-emerald-600" :
                                            (data.type === 'expense' ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600")
                                    )}>
                                        {t(data.type)}
                                    </span>
                                )}
                            </div>
                            {data.desc && (
                                <span className="text-xs font-medium text-foreground/80 mt-0.5 max-w-[200px] truncate">
                                    {data.desc}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }

            // 2. Bar Chart (Aggregated Income/Expense Data)
            if (data.income !== undefined || data.expense !== undefined) {
                return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm min-w-[150px] rtl:text-right">
                        <div className="font-semibold text-sm mb-2 text-foreground/80 border-b border-border/50 pb-1">{data.name}</div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-emerald-600">
                                <span className="text-xs font-medium">{t('income')}</span>
                                <span className="font-mono text-sm font-bold">{currency} {(data.income || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-rose-600">
                                <span className="text-xs font-medium">{t('expense')}</span>
                                <span className="font-mono text-sm font-bold">{currency} {(data.expense || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                );
            }

            // 3. Pie Chart (Category Breakdown)
            if (data.value !== undefined) {
                return (
                    <div className="bg-card border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm rtl:text-right">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                                <span className="text-sm font-semibold">{data.name}</span>
                            </div>
                            <span className="font-bold text-lg font-mono tracking-tight text-primary">
                                {currency} {data.value.toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            }
        }
        return null;
    };

    const isRTL = language === 'ar';

    return (
        <Card className="bg-background border border-border shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-serif">
                    {chartType === 'trend' ? t('balanceTrend') : (chartType === 'pie' ? t('expenseBreakdown') : t('incomeVsExpense'))}
                </CardTitle>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                    <button
                        onClick={() => setChartType("trend")}
                        className={cn("p-1.5 rounded-md transition-all", chartType === "trend" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                        title={t('balanceTrend')}
                    >
                        <TrendingUp size={16} />
                    </button>
                    <button
                        onClick={() => setChartType("bar")}
                        className={cn("p-1.5 rounded-md transition-all", chartType === "bar" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                        title={t('incomeVsExpense')}
                    >
                        <BarChart3 size={16} />
                    </button>
                    <button
                        onClick={() => setChartType("pie")}
                        className={cn("p-1.5 rounded-md transition-all", chartType === "pie" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                        title={t('expenseBreakdown')}
                    >
                        <PieIcon size={16} />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="pl-0 pb-6">
                <div className="h-[350px] w-full min-w-0" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === "bar" ? (
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 45, bottom: 20 }}>
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    fontFamily="var(--font-sans)"
                                    reversed={isRTL}
                                    tickMargin={10}
                                />
                                <YAxis
                                    orientation="left"
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${currency} ${value}`}
                                    fontFamily="var(--font-sans)"
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                    content={<CustomTooltip />}
                                />
                                <Bar dataKey="income" name={t('income')} fill="#059669" radius={[4, 4, 0, 0]} opacity={0.9} />
                                <Bar dataKey="expense" name={t('expense')} fill="#e11d48" radius={[4, 4, 0, 0]} opacity={0.9} />
                            </BarChart>
                        ) : chartType === "trend" ? (
                            <AreaChart data={balanceTrendData} margin={{ top: 20, right: 30, left: 45, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    fontFamily="var(--font-sans)"
                                    tickFormatter={(val) => val.split('__')[0]}
                                    reversed={isRTL}
                                    tickMargin={10}
                                />
                                <YAxis
                                    orientation="left"
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${currency} ${value}`}
                                    fontFamily="var(--font-sans)"
                                    width={80}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                            </AreaChart>
                        ) : (
                            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <Pie
                                    data={expenseBreakdown}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {expenseBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--background)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
