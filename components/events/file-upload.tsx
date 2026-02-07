'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileText, X } from 'lucide-react';
import { uploadFile } from '@/app/actions/uploads';
import { toast } from 'sonner';

interface FileUploadProps {
    value?: string;
    onChange: (url: string) => void;
    accept?: string;
    label: string;
}

export function FileUpload({ value, onChange, accept, label }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadFile(formData);

            if ('error' in result) {
                toast.error(result.error);
            } else {
                toast.success('File uploaded');
                onChange(result.url);
            }
        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">{label}</label>

            {value ? (
                <div className="relative group rounded-lg border border-neutral-700 bg-neutral-900 overflow-hidden">
                    {accept?.includes('image') ? (
                        <div className="relative h-48 w-full">
                            <img src={value} alt="Preview" className="w-full h-full object-cover" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center p-4">
                            <FileText className="h-8 w-8 text-blue-500 mr-3" />
                            <span className="text-sm text-neutral-300 truncate flex-1">{value.split('/').pop()}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemove}
                                className="text-neutral-400 hover:text-red-400"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-neutral-900 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin mb-2" />
                            ) : (
                                <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                            )}
                            <p className="mb-2 text-sm text-neutral-400">
                                <span className="font-semibold">{uploading ? 'Uploading...' : 'Click to upload'}</span>
                            </p>
                            <p className="text-xs text-neutral-500">{accept?.includes('image') ? 'PNG, JPG' : 'PDF'}</p>
                        </div>
                        <Input
                            type="file"
                            className="hidden"
                            accept={accept}
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
