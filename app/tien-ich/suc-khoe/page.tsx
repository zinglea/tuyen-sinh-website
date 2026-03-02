import Header from '@/components/Header'
import HealthCheckCAND from '@/components/HealthCheckCAND'

export const metadata = {
    title: 'Kiểm tra Yêu cầu Sức khỏe CAND - Cổng Tuyển sinh CAND',
    description: 'Công cụ tự động đánh giá và kiểm tra điều kiện sức khỏe dự tuyển vào CAND theo Thông tư 62/2023/TT-BCA.',
}

export default function HealthCheckPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-police-dark mb-4 uppercase tracking-tight">
                        Tiện ích Tuyển sinh
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Sử dụng công cụ dưới đây để tự đánh giá nhanh xem bạn có đáp ứng các tiêu chuẩn sơ tuyển về sức khỏe để đăng ký dự thi vào các trường Công an nhân dân hay không.
                    </p>
                </div>

                <HealthCheckCAND />
            </main>
        </div>
    )
}
