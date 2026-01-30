import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Share2, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

interface AttachmentViewerProps {
    src: string;
    onClose: () => void;
    onDownload: () => void;
    onShare: () => void;
}

export function AttachmentViewer({ src, onClose, onDownload, onShare }: AttachmentViewerProps) {
    const { t } = useLanguage();
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState<'image' | 'pdf' | 'unknown'>('unknown');

    useEffect(() => {
        // Initial guess based on string
        if (src.startsWith("data:application/pdf") || src.toLowerCase().includes(".pdf")) {
            setViewMode('pdf');
        } else {
            setViewMode('image');
        }
    }, [src]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) handleZoomIn();
                else handleZoomOut();
            }
        };
        // Add listener to specific element if possible, but window for now safe for modal
        window.addEventListener('wheel', handleWheel, { passive: false });
        // Clean up
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    // Helper to convert base64 to blob url for PDF iframe if needed
    const getSrc = () => {
        return src;
    };

    const isPDF = viewMode === 'pdf';

    return (
        <div className="relative flex flex-col h-full w-full bg-background/95 backdrop-blur-sm">
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent text-white">
                <div className="flex gap-2">
                    <button onClick={onClose} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
                        <X size={20} />
                    </button>
                    <span className="text-sm font-medium self-center px-2 opacity-80">
                        {isPDF ? "Document Viewer" : "Image Viewer"}
                    </span>
                </div>

                <div className="flex gap-2">
                    {!isPDF && (
                        <>
                            <button onClick={handleZoomOut} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors" title="Zoom Out">
                                <ZoomOut size={20} />
                            </button>
                            <span className="self-center min-w-[3ch] text-center text-xs">{Math.round(scale * 100)}%</span>
                            <button onClick={handleZoomIn} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors" title="Zoom In">
                                <ZoomIn size={20} />
                            </button>
                            <button onClick={handleReset} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors" title="Reset">
                                <RotateCcw size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-4"
                onMouseMove={!isPDF ? handleMouseMove : undefined}
                onMouseUp={!isPDF ? handleMouseUp : undefined}
                onMouseLeave={!isPDF ? handleMouseUp : undefined}
            >
                {isPDF ? (
                    <iframe
                        src={getSrc()}
                        className="w-full h-full rounded-lg border border-white/10 bg-white"
                        title="Document"
                    />
                ) : (
                    <div
                        className="relative cursor-grab active:cursor-grabbing"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                        onMouseDown={handleMouseDown}
                    >
                        <img
                            src={src}
                            alt="Attachment"
                            draggable={false}
                            className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl rounded-md"
                            onError={() => {
                                // If image fails to load, assume it might be a document/PDF and switch mode
                                setViewMode('pdf');
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                <button
                    onClick={onDownload}
                    className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold shadow-lg hover:bg-gray-100 transition-transform hover:scale-105 active:scale-95"
                >
                    <Download size={18} />
                    <span>Download</span>
                </button>
                <button
                    onClick={onShare}
                    className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:brightness-110 transition-transform hover:scale-105 active:scale-95"
                >
                    <Share2 size={18} />
                    <span>Share</span>
                </button>
            </div>
        </div>
    );
}
