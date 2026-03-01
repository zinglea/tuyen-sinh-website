'use client';
import { useEffect, useState } from 'react';

export default function PdfViewerClient({ fileUrl }: { fileUrl: string }) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect mobile browsers
        if (typeof window !== 'undefined') {
            setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        }

        let isMounted = true;

        async function fetchPdf() {
            try {
                // Fetch the PDF as a raw binary stream from the octet-stream API
                const res = await fetch(fileUrl);
                const blob = await res.blob();

                // Convert the raw stream back into a PDF Blob locally in RAM
                const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                const newBlobUrl = URL.createObjectURL(pdfBlob);

                if (isMounted) {
                    setBlobUrl(newBlobUrl);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading PDF", err);
                if (isMounted) setLoading(false);
            }
        }

        fetchPdf();

        return () => {
            isMounted = false;
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [fileUrl]);

    if (loading) {
        return (
            <div className="w-full h-[85vh] flex flex-col items-center justify-center bg-slate-50 rounded-2xl animate-pulse border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 border-4 border-police-light border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-slate-500 font-semibold">Đang chuẩn bị trình xem tài liệu...</span>
            </div>
        );
    }

    if (!blobUrl) {
        return (
            <div className="w-full h-[85vh] flex items-center justify-center bg-red-50 rounded-2xl text-red-500 border-2 border-dashed border-red-200 font-semibold">
                Lỗi tải tài liệu. Vui lòng thử lại.
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="w-full py-16 px-6 flex flex-col items-center justify-center bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Chế độ xem trên thiết bị di động</h3>
                <p className="text-slate-600 mb-6 max-w-sm">
                    Trình duyệt trên điện thoại của bạn không hỗ trợ nhúng thẻ PDF nội bộ. Hệ thống đã xử lý và chuẩn bị sẵn tệp an toàn cho điện thoại.
                </p>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                        👀 Xem tài liệu toàn màn hình
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[85vh] rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
            <iframe src={`${blobUrl}#toolbar=0&view=FitH`} width="100%" height="100%" className="border-none w-full h-full bg-slate-100"></iframe>
        </div>
    );
}
