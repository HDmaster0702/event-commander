'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function uploadFile(formData: FormData): Promise<{ url: string } | { error: string }> {
    const file = formData.get('file') as File;

    if (!file) {
        return { error: 'No file provided' };
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${randomUUID()}-${safeName}`;

        // Save to public/uploads
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const filePath = join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        // Return browser-accessible URL
        return { url: `/uploads/${fileName}` };
    } catch (error: any) {
        console.error('Upload error:', error);
        return { error: error.message || 'Failed to save file' };
    }
}
