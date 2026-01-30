export async function uploadFile(file: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();
        return data.url; // Returns /api/file/<file_id>
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}
