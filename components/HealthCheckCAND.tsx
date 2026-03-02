'use client'
import React, { useState, useEffect } from 'react';

const HealthCheckCAND = () => {
    // Trạng thái mặc định (Giả định là người bình thường và đạt chuẩn)
    const [formData, setFormData] = useState({
        gender: 'Nam',
        priority: 'Bình thường',
        height: 165, // cm
        weight: 60, // kg
        visionDefect: false, // Có mắc tật khúc xạ không?
        diopters: 0, // Số đi-ốp nếu có
        tattoos: false, // Xăm hình (không tính xăm mày/môi thẩm mỹ nữ)
        piercings: false, // Lỗ xỏ khuyên sai quy định
        keloids: false, // Sẹo lồi vùng hở
    });

    const [result, setResult] = useState<{ passed: boolean, messages: string[] }>({ passed: true, messages: [] });

    // Xử lý thay đổi input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            finalValue = checked;
        } else if (type === 'number') {
            finalValue = Number(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    // Logic kiểm tra các điều kiện dựa trên Thông tư 62/2023/TT-BCA
    const evaluateHealth = () => {
        let passed = true;
        let messages: string[] = [];

        // 1. Lấy khung chiều cao tiêu chuẩn dựa trên giới tính & ưu tiên
        let minHeight = 0, maxHeight = 195;
        if (formData.gender === 'Nam') {
            switch (formData.priority) {
                case 'Dân tộc thiểu số': minHeight = 162; break;
                case 'Nhóm UT1': minHeight = 160; break;
                case 'Tuyển thẳng THPT': minHeight = 155; maxHeight = 300; break;
                case 'Trình độ ĐH KH-KT / Chuyên gia': minHeight = 162; break;
                default: minHeight = 164; break;
            }
        } else {
            switch (formData.priority) {
                case 'Dân tộc thiểu số': minHeight = 156; maxHeight = 180; break;
                case 'Nhóm UT1': minHeight = 155; maxHeight = 180; break;
                case 'Tuyển thẳng THPT': minHeight = 150; maxHeight = 300; break;
                case 'Trình độ ĐH KH-KT / Chuyên gia': minHeight = 156; maxHeight = 180; break;
                default: minHeight = 158; maxHeight = 180; break;
            }
        }

        // Đánh giá Chiều cao
        if (formData.height < minHeight || formData.height > maxHeight) {
            passed = false;
            messages.push(`❌ Chiều cao không đạt. Yêu cầu đối với ${formData.gender} (${formData.priority}) là từ ${minHeight}cm đến ${maxHeight === 300 ? 'trở lên' : maxHeight + 'cm'}.`);
        } else {
            messages.push(`✅ Chiều cao: Đạt (${formData.height}cm)`);
        }

        // 2. Đánh giá BMI (Chỉ số khối cơ thể)
        const bmi = Number((formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1));
        if (bmi < 18.5 || bmi >= 30) {
            passed = false;
            messages.push(`❌ BMI không đạt (${bmi}). Yêu cầu BMI từ 18.5 đến dưới 30.`);
        } else {
            messages.push(`✅ Cân nặng và BMI: Đạt (BMI = ${bmi})`);
        }

        // 3. Đánh giá Thị lực
        let maxDiopters = formData.priority === 'Trình độ ĐH KH-KT / Chuyên gia' ? 5 : 3;
        if (formData.visionDefect && formData.diopters > maxDiopters) {
            passed = false;
            messages.push(`❌ Thị lực không đạt. Mức độ cận/viễn thị tối đa cho phép là ${maxDiopters} đi-ốp.`);
        } else if (formData.visionDefect) {
            messages.push(`✅ Thị lực: Chấp nhận tật khúc xạ ${formData.diopters} đi-ốp (Dưới ngưỡng ${maxDiopters}).`);
        } else {
            messages.push(`✅ Thị lực: Mặc định bình thường (Đạt)`);
        }

        // 4. Các chỉ số đặc thù (Hình xăm, Sẹo, Khuyên)
        if (formData.tattoos) {
            passed = false;
            messages.push(`❌ Vi phạm chỉ số đặc thù: Có vết trổ, vết xăm trên da.`);
        }
        if (formData.piercings) {
            passed = false;
            messages.push(`❌ Vi phạm chỉ số đặc thù: Lỗ xỏ khuyên sai quy định.`);
        }
        if (formData.keloids) {
            passed = false;
            messages.push(`❌ Vi phạm chỉ số đặc thù: Sẹo lồi co kéo ở vùng đầu, mặt, cổ, tay, chân.`);
        }

        setResult({ passed, messages });
    };

    useEffect(() => {
        evaluateHealth();
    }, [formData]);

    return (
        <div className="max-w-3xl mx-auto p-6 lg:p-10 bg-white shadow-xl rounded-2xl font-sans text-slate-800 border border-slate-100">
            <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-6">
                {/* Biểu tượng CAND SVG đơn giản */}
                <div className="w-14 h-14 bg-police-50 rounded-2xl flex items-center justify-center shrink-0">
                    <svg className="w-8 h-8 text-police-dark" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.49l7-3.11v8.61z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-police-dark">Kiểm tra Yêu cầu Sức khỏe CAND</h2>
                    <p className="text-slate-500 text-sm mt-1">Dựa trên Thông tư 62/2023/TT-BCA</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Giới tính */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Giới tính</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition cursor-pointer outline-none">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                    </select>
                </div>

                {/* Diện ưu tiên */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Diện xét tuyển / Ưu tiên</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition cursor-pointer outline-none text-sm">
                        <option value="Bình thường">Học sinh/Thí sinh Bình thường</option>
                        <option value="Dân tộc thiểu số">Người Dân tộc thiểu số</option>
                        <option value="Nhóm UT1">Đối tượng ưu tiên 01 Nhóm UT1</option>
                        <option value="Tuyển thẳng THPT">Tuyển thẳng / Xét tuyển THPT</option>
                        <option value="Trình độ ĐH KH-KT / Chuyên gia">Có bằng ĐH kỹ thuật / Chuyên gia, TS</option>
                    </select>
                </div>

                {/* Chiều cao */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Chiều cao (cm)</label>
                    <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition outline-none" min={100} max={250} />
                </div>

                {/* Cân nặng */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Cân nặng (kg)</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition outline-none" min={30} max={150} />
                </div>
            </div>

            <div className="mb-8 bg-blue-50/50 border border-blue-100 p-5 rounded-2xl">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-blue-500">🏥</span> Tình trạng đặc thù (Nhấn chọn nếu mắc phải)
                </h3>

                <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" name="visionDefect" checked={formData.visionDefect} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500/30" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700 transition">Mắt bị tật khúc xạ (Cận thị / Viễn thị / Loạn thị)</span>
                    </label>

                    {formData.visionDefect && (
                        <div className="ml-8 flex items-center space-x-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm inline-flex">
                            <span className="text-sm font-bold text-slate-600">Độ cao nhất:</span>
                            <input type="number" step="0.25" name="diopters" value={formData.diopters} onChange={handleChange} className="w-24 p-2 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-400" min={0} max={20} />
                            <span className="text-sm text-slate-500 font-medium">đi-ốp</span>
                        </div>
                    )}

                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" name="tattoos" checked={formData.tattoos} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500/30" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700 transition">Có hình xăm, vết trổ trên da (trừ xăm thẩm mỹ chân mày/môi ở Nữ)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" name="piercings" checked={formData.piercings} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500/30" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700 transition">Xỏ khuyên sai quy định (Nam có khuyên, Nữ &gt; 1 lỗ/tai)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" name="keloids" checked={formData.keloids} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500/30" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700 transition">Có sẹo lồi co kéo ở vùng hở (đầu, mặt, cổ, tay, chân)</span>
                    </label>
                </div>
            </div>

            {/* Box Kết quả đánh giá */}
            <div className={`p-6 rounded-2xl border-2 ${result.passed ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50'}`}>
                <div className="flex items-center space-x-4 mb-4">
                    <div className={`text-5xl ${result.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {result.passed ? '👮‍♂️ ✅' : '👮‍♂️ ❌'}
                    </div>
                    <div>
                        <h3 className={`text-xl lg:text-2xl font-extrabold ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {result.passed ? 'ĐỦ ĐIỀU KIỆN SỨC KHỎE (DỰ KIẾN)' : 'CHƯA ĐẠT YÊU CẦU SỨC KHỎE'}
                        </h3>
                    </div>
                </div>

                <ul className="space-y-2 mt-5 text-sm md:text-base border-t border-black/5 pt-4">
                    {result.messages.map((msg, idx) => (
                        <li key={idx} className={`font-semibold ${msg.includes('❌') ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {msg}
                        </li>
                    ))}
                </ul>
                <p className="mt-5 text-xs text-slate-500 italic leading-relaxed">
                    * Lưu ý: Kết quả mang tính tham khảo nhanh dựa trên các chỉ số tự nhập theo Thông tư 62/2023/TT-BCA. Quyết định cuối cùng phụ thuộc vào Hội đồng khám sức khỏe y tế thực tế tại địa phương/đơn vị xơ tuyển.
                </p>
            </div>
        </div>
    );
};

export default HealthCheckCAND;
