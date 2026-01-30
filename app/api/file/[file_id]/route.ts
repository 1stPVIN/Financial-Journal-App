import { NextRequest, NextResponse } from "next/server";

function getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'webp': return 'image/webp';
        case 'gif': return 'image/gif';
        default: return 'application/octet-stream';
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ file_id: string }> }) {
    try {
        const { file_id: fileId } = await params;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Get file path from Telegram
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const data = await res.json();

        if (!data.ok) {
            console.error("Telegram GetFile Error:", data);
            return NextResponse.json({ error: "Failed to get file info from Telegram", details: data }, { status: 500 });
        }

        const filePath = data.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
        const mimeType = getMimeType(filePath);

        // Fetch and serve the file as a buffer to ensure reliable inline display
        const fileRes = await fetch(downloadUrl);
        const arrayBuffer = await fileRes.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `inline; filename="attachment.${filePath.split('.').pop()}"`,
                "Cache-Control": "public, max-age=3600"
            },
        });

    } catch (error: any) {
        console.error("Retrieve Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
