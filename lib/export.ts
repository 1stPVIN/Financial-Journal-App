import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Transaction } from '@/lib/types';

interface ExportData {
    transactions: Transaction[];
    summary: {
        income: number;
        expense: number;
        savings: number;
        net: number;
        currency: string;
    };
    categoryLookup: (id: string) => string;
}

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to fetch image for Excel:", e);
        return null;
    }
};

export async function exportToExcel({ transactions, summary, categoryLookup }: ExportData) {
    // Pre-process transactions to fetch remote images
    const processedTransactions = await Promise.all(transactions.map(async (t) => {
        const originalUrl = t.attachment; // Keep original URL for linking
        let attachment = undefined; // Reset attachment (will be base64 if image)
        let resolvedFilename: string | undefined = undefined;

        if (originalUrl && !originalUrl.startsWith('data:') && (originalUrl.startsWith('/api/file/') || originalUrl.startsWith('http'))) {
            try {
                const res = await fetch(originalUrl);

                // Get Metadata from headers to determine nice filename
                const disposition = res.headers.get('content-disposition');
                const contentType = res.headers.get('content-type');
                if (disposition && disposition.includes('filename=')) {
                    // Extract filename from header
                    const match = disposition.match(/filename="?([^"]+)"?/);
                    if (match && match[1]) resolvedFilename = match[1];
                }

                if (!resolvedFilename) {
                    // Fallback
                    const cleanUrl = originalUrl.split('?')[0];
                    const baseName = decodeURIComponent(cleanUrl.split('/').pop() || 'file');
                    // If ID is ugly (long alphanumeric), use generic
                    if (baseName.length > 20 && !baseName.includes('.')) {
                        const ext = contentType?.split('/')[1] || 'file';
                        resolvedFilename = `Attachment.${ext}`;
                    } else {
                        resolvedFilename = baseName;
                    }
                }

                const blob = await res.blob();
                if (blob.type.startsWith('image/')) {
                    attachment = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (e) {
                console.warn("Failed to fetch attachment for Excel:", e);
            }
        } else if (originalUrl && originalUrl.startsWith('data:image')) {
            attachment = originalUrl;
            resolvedFilename = "Image.png";
        }

        // Return as any to allow extra properties
        return { ...t, attachment, originalUrl, resolvedFilename } as any;
    }));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Financial Journal App';
    workbook.created = new Date();

    // ==========================================
    // SHEET 1: DASHBOARD
    // ==========================================
    const sheetDashboard = workbook.addWorksheet('Dashboard', {
        properties: { tabColor: { argb: 'FFD4A373' } },
        views: [{ showGridLines: false }]
    });

    // Title
    sheetDashboard.mergeCells('B2:E2');
    const titleCell = sheetDashboard.getCell('B2');
    titleCell.value = 'Financial Journal Report';
    titleCell.font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center' };

    // Subtitle
    sheetDashboard.mergeCells('B3:E3');
    const subtitleCell = sheetDashboard.getCell('B3');
    subtitleCell.value = `Generated on ${new Date().toLocaleDateString()}`;
    subtitleCell.font = { name: 'Calibri', size: 12, italic: true, color: { argb: 'FF555555' } };
    subtitleCell.alignment = { horizontal: 'center' };

    // Summary Table Header
    sheetDashboard.getRow(5).values = ['', 'Summary Category', 'Amount', 'Currency'];
    ['B5', 'C5', 'D5', 'E5'].forEach(key => {
        const cell = sheetDashboard.getCell(key);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F4F4F' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.border = { bottom: { style: 'medium' } };
        cell.alignment = { horizontal: 'center' };
    });

    // Summary Data
    const summaryData = [
        { label: 'Total Income', value: summary.income, color: 'FF047857' }, // Emerald
        { label: 'Total Expenses', value: summary.expense, color: 'FFBE123C' }, // Rose
        { label: 'Total Savings', value: summary.savings, color: 'FFB45309' }, // Amber
        { label: 'Net Balance', value: summary.net, color: 'FF000000', bold: true } // Black
    ];

    summaryData.forEach((item, index) => {
        const r = index + 6;
        sheetDashboard.getCell(`C${r}`).value = item.label;
        const valCell = sheetDashboard.getCell(`D${r}`);
        valCell.value = item.value;
        valCell.numFmt = '#,##0.00';
        valCell.font = { color: { argb: item.color }, bold: item.bold || false };
        sheetDashboard.getCell(`E${r}`).value = summary.currency;
    });

    // Column Widths
    sheetDashboard.getColumn(2).width = 5;  // Spacing
    sheetDashboard.getColumn(3).width = 25; // Label
    sheetDashboard.getColumn(4).width = 20; // Value
    sheetDashboard.getColumn(5).width = 10; // Currency

    // Add Borders to table
    for (let r = 5; r <= 9; r++) {
        ['C', 'D', 'E'].forEach(c => {
            sheetDashboard.getCell(`${c}${r}`).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    }

    // ==========================================
    // SHEET 2: TRANSACTIONS LOG
    // ==========================================
    const sheetLog = workbook.addWorksheet('Transactions Log', {
        properties: { tabColor: { argb: 'FF2E7D32' } }
    });

    // Headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Payment Link', 'Attachment'];
    sheetLog.addRow(headers);
    const headerRow = sheetLog.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E2DD' } }; // Light beige
        cell.font = { bold: true, size: 12, color: { argb: 'FF333333' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'double', color: { argb: 'FFD4A373' } } };
    });

    // Data
    processedTransactions.forEach((t, index) => {
        const row = sheetLog.addRow([
            new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            t.desc,
            categoryLookup(t.categoryId),
            t.type.toUpperCase(),
            t.amount,
            t.currency || summary.currency,
            t.paymentLink || '',
            '' // Attachment acts as placeholder
        ]);

        // Conditional Styling for Type and Amount
        const typeCell = row.getCell(4);
        const amountCell = row.getCell(5);

        amountCell.numFmt = '#,##0.00';

        if (t.type === 'income') {
            typeCell.font = { color: { argb: 'FF047857' }, bold: true }; // Green
            amountCell.font = { color: { argb: 'FF047857' }, bold: true };
        } else if (t.type === 'expense') {
            typeCell.font = { color: { argb: 'FFBE123C' } }; // Red
            amountCell.font = { color: { argb: 'FFBE123C' } };
        } else {
            typeCell.font = { color: { argb: 'FFB45309' } }; // Amber (Savings)
            amountCell.font = { color: { argb: 'FFB45309' } };
        }

        // Hyperlink for Payment Link
        if (t.paymentLink) {
            const linkCell = row.getCell(7);
            linkCell.value = { text: 'Link', hyperlink: t.paymentLink };
            linkCell.font = { color: { argb: 'FF2563EB' }, underline: true }; // Blue
        }

        // Attachment Cell (Link Logic)
        if (t.originalUrl) {
            const attachCell = row.getCell(8);
            const fullUrl = t.originalUrl.startsWith('http') ? t.originalUrl : `${window.location.origin}${t.originalUrl}`;

            // Use resolved filename or fallback "Attachment"
            const displayName = t.resolvedFilename || "Attachment";

            attachCell.value = { text: displayName, hyperlink: fullUrl };
            attachCell.font = { color: { argb: 'FF2563EB' }, underline: true };
        }

        // Embed Image if exists
        if (t.attachment) {
            try {
                // Determine extension
                let ext: "png" | "jpeg" = "png";
                if (t.attachment.startsWith("data:image/jpeg") || t.attachment.startsWith("data:image/jpg")) {
                    ext = "jpeg";
                }

                // Add image to workbook
                const imageId = workbook.addImage({
                    base64: t.attachment,
                    extension: ext,
                });

                // Add to sheet
                const imgRowIdx = index + 1;

                sheetLog.addImage(imageId, {
                    tl: { col: 7, row: imgRowIdx }, // col 7 is 'Attachment'
                    ext: { width: 100, height: 100 },
                    editAs: 'oneCell'
                });

                // Increase row height to fit image
                row.height = 80;
            } catch (e) {
                console.warn("Excel Image Error", e);
            }
        }
    });

    // Column Widths
    sheetLog.columns = [
        { width: 12 }, // Date
        { width: 35 }, // Desc
        { width: 20 }, // Cat
        { width: 12 }, // Type
        { width: 15 }, // Amount
        { width: 10 }, // Curr
        { width: 30 }, // Link
        { width: 30 }  // Attach
    ];

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Financial-Journal-${new Date().toISOString().split('T')[0]}.xlsx`);
}
