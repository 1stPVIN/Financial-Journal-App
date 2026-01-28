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

export async function exportToExcel({ transactions, summary, categoryLookup }: ExportData) {
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
    transactions.forEach((t, index) => {
        const row = sheetLog.addRow([
            new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            t.desc,
            categoryLookup(t.categoryId),
            t.type.toUpperCase(),
            t.amount,
            t.currency || summary.currency,
            t.paymentLink || '',
            '' // Attachment acts as placeholder for image
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
            typeCell.font = { color: { argb: 'FFB45309' } }; // Amber (Savings)
            amountCell.font = { color: { argb: 'FFB45309' } };
        }

        // Hyperlink for Payment Link
        if (t.paymentLink) {
            const linkCell = row.getCell(7);
            linkCell.value = { text: 'Link', hyperlink: t.paymentLink };
            linkCell.font = { color: { argb: 'FF2563EB' }, underline: true }; // Blue
        }

        // Embed Image if exists
        if (t.attachment) {
            try {
                // Determine extension (hacky basic check, optimally regex looking for data:image/fmt)
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
                // Note: 'tl' is 0-indexed column and row. 
                // Row index in sheet depends on header. Header is row 6? No, sheetLog header is row 1?.
                // sheetLog started fresh. Headers added at row 1.
                // forEach index 0 -> Row 2
                // So row index for image is index + 1
                const imgRowIdx = index + 1;

                sheetLog.addImage(imageId, {
                    tl: { col: 7, row: imgRowIdx }, // col 7 is 'Attachment'
                    ext: { width: 120, height: 120 }
                });

                // Increase row height to fit image
                row.height = 130;
            } catch (e) {
                // Fallback text
                row.getCell(8).value = "Has Image";
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
        { width: 35 }  // Attach (Wider for image space)
    ];

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Financial-Journal-${new Date().toISOString().split('T')[0]}.xlsx`);
}
