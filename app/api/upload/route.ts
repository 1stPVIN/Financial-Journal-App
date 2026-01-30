import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Prepare FormData for Telegram
        const telegramFormData = new FormData();
        telegramFormData.append("chat_id", chatId);
        telegramFormData.append("document", file);

        // Upload to Telegram
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: "POST",
            body: telegramFormData,
        });

        const data = await res.json();

        if (!data.ok) {
            console.error("Telegram Upload Error:", data);
            return NextResponse.json({ error: "Failed to upload to Telegram", details: data }, { status: 500 });
        }

        // Extract file_id and file_name
        // Telegram returns document object
        const doc = data.result.document;
        const fileId = doc.file_id;
        const fileName = doc.file_name || file.name;
        const mimeType = doc.mime_type || file.type;

        return NextResponse.json({
            success: true,
            file_id: fileId,
            file_name: fileName,
            mime_type: mimeType,
            url: `/api/file/${fileId}` // Our proxy URL
        });

    } catch (error: any) {
        console.error("Upload Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
