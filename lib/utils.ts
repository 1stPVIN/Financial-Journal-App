import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "SAR") {
  try {
    // Sanitize input just in case (remove quotes, spaces)
    const cleanCurrency = currency?.toString().replace(/['"\s]/g, '') || "SAR";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cleanCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Currency Error:", currency, error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function exportToCsv(filename: string, rows: any[]) {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? "" : row[k];
        cell = cell instanceof Date
          ? cell.toLocaleString()
          : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
