export type TransactionType = "income" | "expense" | "savings";

export interface Category {
    id: string;
    name: string;
    icon: string; // Name of the Lucide icon
    color: string; // Hex code or Tailwind class
    type: TransactionType;
}

export interface Transaction {
    id: number;
    date: string;
    desc: string;
    categoryId: string; // Link to Category
    amount: number;
    type: TransactionType;
    paymentLink?: string;
    attachment?: string; // Base64 string for image/file
    currency?: string; // Currency code (e.g., USD, SAR)
}

export interface RecurringExpense {
    id: string;
    desc: string;
    amount: number;
    categoryId: string;
    dueDateDay: number; // 1-31
    paymentLink?: string;
    active: boolean;
    attachment?: string;
    lastPaidDate?: string; // ISO Date string of last payment
}
