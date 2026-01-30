import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        console.log(`[Upload API] Received file: ${file?.name} (${file?.size} bytes)`);

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error("[Upload API] Missing credentials");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Convert file to ArrayBuffer/Blob to give a fresh stream to Telegram
        // Directly passing the incoming 'file' sometimes causes stream lock/consumption issues
        const arrayBuffer = await file.arrayBuffer();
        const fileBlob = new Blob([arrayBuffer], { type: file.type });

        // Prepare FormData for Telegram
        const telegramFormData = new FormData();
        telegramFormData.append("chat_id", chatId);
        telegramFormData.append("document", fileBlob, file.name);

        console.log("[Upload API] Sending to Telegram...");

        // Upload to Telegram
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: "POST",
            body: telegramFormData,
        });

        const data = await res.json();

        if (!data.ok) {
            console.error("[Upload API] Telegram Error:", JSON.stringify(data));
            return NextResponse.json({ error: "Failed to upload to Telegram", details: data }, { status: 500 });
        }

        console.log("[Upload API] Success:", data.result.document?.file_id);

        // Extract file_id and file_name
        // Telegram returns document object for files
        // Note: For images, it might return 'photo' array, but sendDocument usually returns 'document'
        const doc = data.result.document || data.result.audio || data.result.video || data.result.voice;

        // Fallback if it's strictly a photo (sendDocument handling images sometimes returns document, sometimes not depend on usage)
        // But sendDocument API usually forces document type.

        const fileId = doc?.file_id;
        const fileName = doc?.file_name || file.name;
        const mimeType = doc?.mime_type || file.type;

        if (!fileId) {
            console.error("[Upload API] No file_id in response:", data);
            return NextResponse.json({ error: "Telegram did not return a file_id", details: data }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            file_id: fileId,
            file_name: fileName,
            mime_type: mimeType,
            url: `/api/file/${fileId}` // Our proxy URL
        });

    } catch (error: any) {
        console.error("[Upload API] Internal Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
