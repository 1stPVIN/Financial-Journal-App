import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Category } from "./types";
import { formatCurrency } from "./utils";
// @ts-ignore
import * as ArabicReshaper from "arabic-reshaper";

// Helper to handle Arabic text (Reshape only - font handles RTL)
const processArabic = (text: string) => {
    if (!text) return "";
    try {
        if (/[\u0600-\u06FF]/.test(text)) {
            const convert = (ArabicReshaper as any).default?.convertArabic || (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).default || ArabicReshaper;
            const converterFunc = typeof convert === 'function' ? convert : convert.convertArabic;

            if (typeof converterFunc === 'function') {
                // Only reshape, don't reverse - font handles RTL
                return converterFunc(text);
            }
            return text;
        }
    } catch (e) {
        return text;
    }
    return text; // Non-arabic text
};

// Load Arabic font from reliable raw GitHub sources (TTF only)
const loadArabicFont = async (): Promise<string | null> => {
    // Raw GitHub links to TTF fonts (these work with jsPDF)
    const fontUrls = [
        // Amiri font from raw GitHub
        'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf',
        // Cairo font from raw GitHub  
        'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf',
        // Noto Sans Arabic as fallback
        'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf',
    ];

    for (const url of fontUrls) {
        try {
            console.log(`Trying to load font from: ${url}`);
            const res = await fetch(url);
            if (res.ok) {
                const buffer = await res.arrayBuffer();
                // Check if file is large enough to be a valid font (> 10KB)
                if (buffer.byteLength > 10000) {
                    // Check it's not HTML (starts with '<')
                    const firstByte = new Uint8Array(buffer)[0];
                    if (firstByte !== 60) { // 60 is '<'
                        console.log(`Successfully loaded font (${buffer.byteLength} bytes)`);
                        return arrayBufferToBase64(buffer);
                    }
                }
            }
        } catch (e) {
            console.warn(`Failed to load font from ${url}:`, e);
        }
    }
    return null;
};

export const generatePDF = async (
    transactions: Transaction[],
    summary: { income: number; expense: number; savings: number; net: number; currency: string },
    getCategory: (id: string) => Category | undefined
) => {
    const doc = new jsPDF();
    const currency = summary.currency;
    let fontLoaded = false;

    try {
        const fontBase64 = await loadArabicFont();
        if (fontBase64) {
            doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
            doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
            doc.setFont("Amiri");
            fontLoaded = true;
            console.log("Arabic font loaded successfully");
        } else {
            console.warn("Could not load Arabic font, using default");
        }
    } catch (err) {
        console.error("Font loading error:", err);
    }

    // Title
    doc.setFontSize(22);
    doc.setTextColor(33, 33, 33);
    doc.text("Financial Journal Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US')}`, 14, 28);
    doc.text("Summary Dashboard", 14, 38);

    // DASHBOARD TILES
    const startY = 45;
    const cardWidth = 55;
    const cardHeight = 35;
    const gap = 10;
    const radius = 3;

    // 1. Net Balance
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(14, startY, cardWidth, cardHeight, radius, radius, "FD");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("NET BALANCE", 20, startY + 12);
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text(formatCurrency(summary.net, currency), 20, startY + 26);

    // 2. Income
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(209, 250, 229);
    doc.roundedRect(14 + cardWidth + gap, startY, cardWidth, cardHeight, radius, radius, "FD");
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70);
    doc.text("TOTAL INCOME", 20 + cardWidth + gap, startY + 12);
    doc.setFontSize(14);
    doc.text(formatCurrency(summary.income, currency), 20 + cardWidth + gap, startY + 26);

    // 3. Expenses
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 226, 226);
    doc.roundedRect(14 + (cardWidth + gap) * 2, startY, cardWidth, cardHeight, radius, radius, "FD");
    doc.setFontSize(9);
    doc.setTextColor(159, 18, 57);
    doc.text("TOTAL EXPENSES", 20 + (cardWidth + gap) * 2, startY + 12);
    doc.setFontSize(14);
    doc.text(formatCurrency(summary.expense, currency), 20 + (cardWidth + gap) * 2, startY + 26);


    // TABLE SECTION
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.text("Transaction Details", 14, startY + cardHeight + 20);

    // Pre-process transactions to fetch remote images (for Telegram/API blobs)
    const processedTransactions = await Promise.all(transactions.map(async (t) => {
        const originalUrl = t.attachment; // Keep original URL for linking
        let attachment = undefined; // Reset attachment (will be base64 if image)
        let resolvedFilename: string | undefined = undefined;
        let mimeType: string | undefined = undefined;

        // If it's a URL (from API) and is an image, fetch it.
        if (originalUrl && !originalUrl.startsWith('data:') && (originalUrl.startsWith('/api/file/') || originalUrl.startsWith('http'))) {
            try {
                const res = await fetch(originalUrl);

                // Get Metadata from headers
                mimeType = res.headers.get('content-type') || undefined;
                const disposition = res.headers.get('content-disposition');
                if (disposition && disposition.includes('filename=')) {
                    // Extract filename from header
                    const match = disposition.match(/filename="?([^"]+)"?/);
                    if (match && match[1]) resolvedFilename = match[1];
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
                console.warn("Failed to fetch image for PDF:", e);
            }
        } else if (originalUrl && originalUrl.startsWith('data:image')) {
            attachment = originalUrl;
            mimeType = 'image/png'; // Default
        }

        // Fallback filename logic
        if (!resolvedFilename && originalUrl) {
            const cleanUrl = originalUrl.split('?')[0];
            const baseName = decodeURIComponent(cleanUrl.split('/').pop() || 'file');
            if (baseName.length > 20 && !baseName.includes('.')) {
                const ext = mimeType?.split('/')[1] || 'file';
                resolvedFilename = `Attachment.${ext}`;
            } else {
                resolvedFilename = baseName;
            }
        }

        // Return as any 
        return { ...t, attachment, originalUrl, resolvedFilename, mimeType } as any;
    }));

    const tableData = processedTransactions.map(t => {
        const cat = getCategory(t.categoryId);
        const tCurrency = t.currency || currency;
        const amountStr = formatCurrency(Math.abs(t.amount), tCurrency);
        const formattedAmount = t.type === 'income' ? `+ ${amountStr}` : `- ${amountStr}`;

        return [
            new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            processArabic(t.desc) || "-",
            processArabic(cat?.name || "Uncategorized") || "-",
            t.type.toUpperCase(),
            formattedAmount,
            t.paymentLink ? "Link" : "-",
            "" // Placeholder for Attachment
        ];
    });

    // Explicit Function Call Pattern (Robust)
    autoTable(doc, {
        startY: startY + cardHeight + 25,
        head: [['Date', 'Description', 'Category', 'Type', 'Amount', 'Link', 'Att.']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            fontStyle: 'normal',
            font: fontLoaded ? 'Amiri' : 'helvetica',
            halign: 'center'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            font: fontLoaded ? 'Amiri' : 'helvetica',
            fontStyle: 'normal',
            halign: 'center',
            minCellHeight: 12 // Default compact height
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            4: { halign: 'right', fontStyle: 'normal' },
            5: { halign: 'center', textColor: [37, 99, 235] }, // Link Color
            6: { halign: 'center', cellWidth: 50 }, // Width for attachment column
        },
        didParseCell: function (data) {
            if (data.section === 'body') {
                const t = processedTransactions[data.row.index];
                // Dynamic Row Height: 
                // Don't expand too much for small icon, but expand for large image
                if (t && t.attachment && t.attachment.startsWith('data:image')) {
                    data.cell.styles.minCellHeight = 50;
                } else if (t && t.originalUrl) {
                    // Ensure enough height for Icon + Text (Icon 10 + space + text ~ 20)
                    data.cell.styles.minCellHeight = 25;
                }

                if (data.column.index === 5 && t.paymentLink) {
                    (data.cell as any).link = t.paymentLink;
                }

                if (data.column.index === 4) {
                    const type = (data.row.raw as string[])[3];
                    if (type === 'INCOME') {
                        data.cell.styles.textColor = [5, 150, 105];
                    } else if (type === 'EXPENSE') {
                        data.cell.styles.textColor = [220, 38, 38];
                    }
                }
            }
        },
        didDrawCell: function (data) {
            if (data.section === 'body') {
                const t = processedTransactions[data.row.index];

                // LINK COLUMN (Index 5)
                if (data.column.index === 5 && t && t.paymentLink) {
                    try {
                        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: t.paymentLink });
                    } catch (e) {
                        console.warn("Error adding link:", e);
                    }
                }

                // ATTACHMENT COLUMN (Index 6)
                if (data.column.index === 6) {
                    // 1. Add Hyperlink if URL exists (Image or PDF)
                    if (t && t.originalUrl) {
                        try {
                            const fullUrl = t.originalUrl.startsWith('http')
                                ? t.originalUrl
                                : `${window.location.origin}${t.originalUrl}`;
                            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: fullUrl });
                        } catch (e) {
                            console.warn("Error adding attachment link:", e);
                        }
                    }

                    // 2. Draw Image if available
                    if (t && t.attachment && t.attachment.startsWith('data:image')) {
                        try {
                            const imgProps = doc.getImageProperties(t.attachment);
                            const ratio = imgProps.height / imgProps.width;
                            const cellWidth = data.cell.width - 4; // Padding
                            const cellHeight = data.cell.height - 4;

                            let w = cellWidth;
                            let h = w * ratio;

                            if (h > cellHeight) {
                                h = cellHeight;
                                w = h / ratio;
                            }

                            const x = data.cell.x + (data.cell.width - w) / 2;
                            const y = data.cell.y + (data.cell.height - h) / 2;

                            doc.addImage(t.attachment, 'JPEG', x, y, w, h);
                        } catch (e) {
                            console.warn("Error adding image to PDF:", e);
                        }
                    }
                    // 3. Fallback: Draw Pro Icon + Filename
                    else if (t && t.originalUrl && !t.attachment) {
                        const cleanUrl = t.originalUrl.split('?')[0];
                        let filename = t.resolvedFilename || decodeURIComponent(cleanUrl.split('/').pop() || 'File');
                        let ext = '';
                        if (t.mimeType && t.mimeType.includes('pdf')) ext = 'pdf';
                        if (!ext && filename.includes('.')) ext = filename.split('.').pop()?.toLowerCase() || '';

                        // Truncate filename nicely
                        if (filename.length > 25) filename = filename.substring(0, 22) + "...";

                        // Icon Dimensions (Standard Document Size)
                        const iconW = 10;
                        const iconH = 12;
                        const centerX = data.cell.x + data.cell.width / 2;
                        const iconX = centerX - iconW / 2;
                        // Center vertically
                        const totalH = iconH + 5; // Icon + Gap + Text
                        const startY = data.cell.y + (data.cell.height - totalH) / 2;

                        drawProFileIcon(doc, iconX, startY, iconW, iconH, ext);

                        // Filename Text
                        doc.setFontSize(7);
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(51, 65, 85); // Slate-700
                        doc.text(filename, centerX, startY + iconH + 4, { align: 'center' });

                        // Restore font
                        doc.setFont("Amiri", "normal");
                    }
                }
            }
        }
    });

    doc.save(`financial_report_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Flaticon-style Vector Icon
function drawProFileIcon(doc: jsPDF, x: number, y: number, w: number, h: number, type: string) {
    const isPdf = type === 'pdf';

    // 1. Paper Sheet (White with subtle border)
    doc.setFillColor(255, 255, 255); // White body
    doc.setDrawColor(203, 213, 225); // Slate-300 border
    doc.setLineWidth(0.1);
    doc.roundedRect(x, y, w, h, 1, 1, 'FD'); // Fill and Draw

    // 2. Folded Corner (Top-Right)
    const foldSize = w * 0.3;
    doc.setFillColor(241, 245, 249); // Slate-100 (Slightly darker white)
    doc.setDrawColor(203, 213, 225); // Slate-300
    // Draw triangle for fold
    // (x+w-fold, y) -> (x+w, y+fold) -> (x+w-fold, y+fold)
    doc.triangle(
        x + w - foldSize, y,
        x + w, y + foldSize,
        x + w - foldSize, y + foldSize,
        'FD'
    );
    // Erase the border created by main rect at the corner (visual trick: redraw white lines? Hard in jspdf. 
    // Easier: Draw fold *over* the main rect. Done.

    // 3. Colored Badge/Label (Bottom-Center or Center)
    const badgeH = h * 0.35;
    const badgeW = w * 0.8;
    const badgeX = x + (w - badgeW) / 2;
    const badgeY = y + h - badgeH - (h * 0.15); // Positioned at bottom area

    // Color choice matches typical file icons
    const badgeColor = isPdf ? [239, 68, 68] : [59, 130, 246]; // Red-500 (PDF) or Blue-500 (Generic)

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]); // Same border
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 0.5, 0.5, 'FD');

    // 4. Text inside Badge
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'bold');
    doc.text(isPdf ? 'PDF' : type.toUpperCase(), x + w / 2, badgeY + badgeH / 2 + 0.5, { align: 'center', baseline: 'middle' });

    // Restore
    doc.setFont('Amiri', 'normal');
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
