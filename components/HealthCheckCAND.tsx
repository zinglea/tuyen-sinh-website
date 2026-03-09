// filepath: components/HealthCheckCAND.tsx
'use client'
import React, { useState, useEffect } from 'react';

const HealthCheckCAND = () => {
    const [formData, setFormData] = useState({
        // 1. THỂ LỰC & ƯU TIÊN
        gender: 'Nam',
        priority: 'Bình thường',
        height: 165,
        weight: 60,

        // 2. KHÁM MẮT 
        visionLeftNoGlass: 10, visionLeftWithGlass: 10, sphereLeft: 0, cylinderLeft: 0,
        visionRightNoGlass: 10, visionRightWithGlass: 10, sphereRight: 0, cylinderRight: 0,

        // 3. BỆNH LÝ LÂM SÀNG
        colorBlindness: false, hearingLoss: false, missingDigits: false,
        flatFeet: false, chronicDiseases: false, stammering: false,

        // 4. CHỈ SỐ ĐẶC THÙ (CƠ BẢN)
        drugUse: false, hairColorIssue: false, skinPigmentation: false, keloids: false,

        // 5. CHI TIẾT XĂM HÌNH (Theo Thông tư 131/2025/TT-BCA)
        hasTattoo: false,
        tattooContentOffensive: false, // Hình xăm có nội dung phản cảm/kích động/bạo lực không?
        tattooLocation: 'hidden', // 'hidden' (kín) hoặc 'exposed' (lộ diện)
        tattooSize: 0, // Kích thước (cm2)
        tattooCount: 1, // Số lượng hình xăm (Quy định mới: lộ diện không quá 01 hình)
        tattooCoverHalfBody: false, // Có chiếm từ 1/2 lưng, ngực, bụng trở lên không?

        // 6. CHI TIẾT XỎ KHUYÊN
        hasPiercing: false,
        piercingLocation: 'ear', // 'ear' (Tai) hoặc 'other' (Mũi, rốn, mày...)
        piercingHealed: true, // (Dành cho Nam) Đã liền sẹo chưa?
        piercingCountPerEar: 1, // (Dành cho Nữ) Số lỗ bấm trên 1 tai
    });

    const [result, setResult] = useState<{ passed: boolean, messages: string[] }>({ passed: true, messages: [] });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;

        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            finalValue = Number(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const evaluateHealth = () => {
        let passed = true;
        let messages: string[] = [];

        // --- 1. KIỂM TRA THỂ LỰC (Theo Điều 2 TT 131/2025) ---
        let minHeight = 0, maxHeight = 195;
        if (formData.gender === 'Nam') {
            switch (formData.priority) {
                case 'Dân tộc thiểu số': minHeight = 162; break;
                case 'Nhóm UT1': minHeight = 160; break;
                case 'Dân tộc thiểu số rất ít người': minHeight = 158; break; // Quy định mới
                case 'Tuyển thẳng THPT': minHeight = 155; maxHeight = 300; break;
                case 'Trình độ ĐH KH-KT / Chuyên gia': minHeight = 162; break;
                default: minHeight = 164; break;
            }
        } else {
            switch (formData.priority) {
                case 'Dân tộc thiểu số': minHeight = 156; maxHeight = 180; break;
                case 'Nhóm UT1': minHeight = 155; maxHeight = 180; break;
                case 'Dân tộc thiểu số rất ít người': minHeight = 152; maxHeight = 180; break; // Quy định mới
                case 'Tuyển thẳng THPT': minHeight = 150; maxHeight = 300; break;
                case 'Trình độ ĐH KH-KT / Chuyên gia': minHeight = 156; maxHeight = 180; break;
                default: minHeight = 158; maxHeight = 180; break;
            }
        }

        if (formData.height < minHeight || formData.height > maxHeight) {
            passed = false;
            messages.push(`❌ Chiều cao: Không đạt (Yêu cầu ${minHeight} - ${maxHeight === 300 ? 'trở lên' : maxHeight}cm).`);
        }

        // Quy định BMI (Loại trường hợp >= 30 hoặc < 18.5)
        const bmi = Number((formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1));
        if (bmi < 18.5 || bmi >= 30) {
            passed = false;
            messages.push(`❌ BMI: Không đạt (${bmi}). Yêu cầu từ 18.5 đến dưới 30.`);
        }

        // --- 2. KIỂM TRA MẮT (Theo khoản 2 Điều 2 TT 131/2025) ---
        const checkEye = (sphere: number, cylinder: number, side: string) => {
            let isDefect = false;
            // Cận/Viễn mỗi mắt KHÔNG QUÁ 3 đi-ốp
            if (Math.abs(sphere) > 3) {
                passed = false;
                messages.push(`❌ Khúc xạ ${side}: Vượt quá quy định (> 3 đi-ốp).`);
                isDefect = true;
            } else if (Math.abs(sphere) > 0) { isDefect = true; }

            // Loạn thị sinh lý hoặc DƯỚI 1 đi-ốp
            if (Math.abs(cylinder) >= 1) {
                passed = false;
                messages.push(`❌ Khúc xạ ${side}: Loạn thị không đạt (>= 1 đi-ốp).`);
                isDefect = true;
            } else if (Math.abs(cylinder) > 0) { isDefect = true; }
            return isDefect;
        };

        const isLeftDefect = checkEye(formData.sphereLeft, formData.cylinderLeft, "Mắt Trái");
        const isRightDefect = checkEye(formData.sphereRight, formData.cylinderRight, "Mắt Phải");

        if (isLeftDefect || isRightDefect) {
            // Trường hợp có tật khúc xạ (đeo kính)
            if (formData.visionLeftWithGlass < 9 && formData.visionRightWithGlass < 9) {
                passed = false; messages.push(`❌ Thị lực qua kính: Ít nhất 1 mắt tối thiểu phải đạt 09/10.`);
            }
            if ((formData.visionLeftWithGlass + formData.visionRightWithGlass) < 19) {
                passed = false; messages.push(`❌ Thị lực qua kính: Tổng 2 mắt phải >= 19/10.`);
            }
        } else {
            // Trường hợp không mắc tật khúc xạ
            if (formData.visionLeftNoGlass < 9 || formData.visionRightNoGlass < 9 || (formData.visionLeftNoGlass + formData.visionRightNoGlass) < 18) {
                passed = false; messages.push(`❌ Thị lực không kính: Mỗi mắt phải đạt 09-10/10 và tổng >= 18/10.`);
            }
        }

        // --- 3. KIỂM TRA BỆNH LÝ & ĐẶC THÙ CƠ BẢN ---
        const conditions = [
            { key: 'drugUse', msg: 'Sử dụng ma túy, tiền chất.' },
            { key: 'hairColorIssue', msg: 'Màu/dạng tóc sai quy định.' },
            { key: 'skinPigmentation', msg: 'Rối loạn sắc tố da (trừ sạm da khu trú vùng má).' },
            { key: 'keloids', msg: 'Sẹo lồi co kéo ở vùng đầu, mặt, cổ, cẳng/bàn tay, cẳng/bàn chân.' },
            { key: 'colorBlindness', msg: 'Mù màu / Rối loạn sắc giác.' },
            { key: 'hearingLoss', msg: 'Bệnh lý tai (Điếc, Viêm tai giữa).' },
            { key: 'missingDigits', msg: 'Thiếu ngón tay, chân.' },
            { key: 'flatFeet', msg: 'Bàn chân bẹt nặng.' },
            { key: 'chronicDiseases', msg: 'Bệnh mãn tính (Tim, Gan, HIV...).' },
            { key: 'stammering', msg: 'Nói ngọng, nói lắp nặng.' }
        ];
        conditions.forEach(cond => {
            if (formData[cond.key as keyof typeof formData]) { passed = false; messages.push(`❌ Bệnh lý/Đặc thù: ${cond.msg}`); }
        });

        // --- 4. KIỂM TRA HÌNH XĂM (Theo Mẫu 1a Phụ lục IV TT 131/2025) ---
        if (formData.hasTattoo) {
            if (formData.tattooContentOffensive) {
                passed = false; messages.push(`❌ Hình xăm: Chứa nội dung phản cảm, chống phá, bạo lực, kỳ dị.`);
            } else if (formData.tattooCoverHalfBody) {
                passed = false; messages.push(`❌ Hình xăm: Chiếm từ 1/2 diện tích lưng, ngực, bụng trở lên.`);
            } else if (formData.tattooLocation === 'exposed') {
                if (formData.tattooSize > 2) {
                    passed = false; messages.push(`❌ Hình xăm lộ diện: Diện tích vượt quá quy định (> 2 cm²).`);
                }
                if (formData.tattooCount > 1) {
                    passed = false; messages.push(`❌ Hình xăm lộ diện: Số lượng vượt quá quy định (> 01 hình).`);
                }
            } else {
                messages.push(`✅ Hình xăm: Thuộc trường hợp có thể được Hội đồng xem xét chấp nhận.`);
            }
        }

        // --- 5. KIỂM TRA XỎ KHUYÊN ---
        if (formData.hasPiercing) {
            if (formData.piercingLocation === 'other') {
                passed = false; messages.push(`❌ Xỏ khuyên: Không được phép bấm lỗ ở mũi hoặc vị trí khác ngoài tai.`);
            } else if (formData.gender === 'Nam' && !formData.piercingHealed) {
                passed = false; messages.push(`❌ Xỏ khuyên (Nam): Lỗ bấm ở tai chưa liền thành sẹo.`);
            } else if (formData.gender === 'Nữ' && formData.piercingCountPerEar > 1) {
                passed = false; messages.push(`❌ Xỏ khuyên (Nữ): Có từ 02 lỗ bấm trở lên trên 01 tai.`);
            } else {
                messages.push(`✅ Xỏ khuyên: Đạt điều kiện chấp nhận được.`);
            }
        }

        if (passed) {
            messages.push(`✅ Thể lực & Chỉ số: Hoàn toàn đạt chuẩn cơ bản.`);
        }

        setResult({ passed, messages });
    };

    useEffect(() => { evaluateHealth(); }, [formData]);

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-10 bg-white shadow-xl rounded-2xl font-sans text-slate-800 border border-slate-100">

            {/* Header */}
            <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-police-light to-police-dark rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-police-light/30">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-police-dark uppercase">Hệ Thống Đánh Giá Sức Khỏe CAND</h2>
                    <p className="text-slate-500 text-sm mt-1">Chi tiết theo Thông tư 131/2025/TT-BCA mới nhất (sửa đổi TT 62/2023)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                {/* CỘT TRÁI (3/12): THỂ LỰC & ƯU TIÊN */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-5 border-b border-slate-200 pb-3 uppercase text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-police-light text-white flex items-center justify-center text-xs">1</span> Thể lực
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Giới tính</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-police-light/30 outline-none text-sm cursor-pointer">
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Diện Xét tuyển</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-police-light/30 outline-none text-sm cursor-pointer">
                                    <option value="Bình thường">Bình thường</option>
                                    <option value="Dân tộc thiểu số">Dân tộc TS</option>
                                    <option value="Nhóm UT1">Nhóm UT1</option>
                                    <option value="Dân tộc thiểu số rất ít người">Dân tộc TS rất ít người</option>
                                    <option value="Tuyển thẳng THPT">Tuyển thẳng</option>
                                    <option value="Trình độ ĐH KH-KT / Chuyên gia">ĐH Kỹ thuật / Chuyên gia</option>
                                </select>
                            </div>
                            <div className="flex space-x-3">
                                <div className="w-1/2">
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Chiều cao (cm)</label>
                                    <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-police-light/30 outline-none text-sm text-center" />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Cân nặng (kg)</label>
                                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-police-light/30 outline-none text-sm text-center" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                        <h3 className="font-bold text-rose-800 mb-4 border-b border-rose-200 pb-3 uppercase text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-rose-500 text-white flex items-center justify-center text-xs">2</span> Bệnh lý nền
                        </h3>
                        <div className="space-y-2.5 text-xs font-medium">
                            <label className="flex items-center space-x-3 cursor-pointer group bg-white p-2 rounded-lg border border-transparent hover:border-rose-200 transition">
                                <input type="checkbox" name="colorBlindness" checked={formData.colorBlindness} onChange={handleChange} className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded" />
                                <span className="group-hover:text-rose-700">Mù màu / Rối loạn sắc giác</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group bg-white p-2 rounded-lg border border-transparent hover:border-rose-200 transition">
                                <input type="checkbox" name="hearingLoss" checked={formData.hearingLoss} onChange={handleChange} className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded" />
                                <span className="group-hover:text-rose-700">Điếc / Viêm tai giữa</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group bg-white p-2 rounded-lg border border-transparent hover:border-rose-200 transition">
                                <input type="checkbox" name="missingDigits" checked={formData.missingDigits} onChange={handleChange} className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded" />
                                <span className="group-hover:text-rose-700">Thiếu ngón tay/chân</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group bg-white p-2 rounded-lg border border-transparent hover:border-rose-200 transition">
                                <input type="checkbox" name="flatFeet" checked={formData.flatFeet} onChange={handleChange} className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded" />
                                <span className="group-hover:text-rose-700">Bàn chân bẹt nặng</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group bg-white p-2 rounded-lg border border-transparent hover:border-rose-200 transition">
                                <input type="checkbox" name="chronicDiseases" checked={formData.chronicDiseases} onChange={handleChange} className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded" />
                                <span className="group-hover:text-rose-700">Tim, Viêm gan, Hen, HIV...</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group bg-white p-2 rounded-lg border border-transparent hover:border-rose-200 transition">
                                <input type="checkbox" name="stammering" checked={formData.stammering} onChange={handleChange} className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded" />
                                <span className="group-hover:text-rose-700">Nói ngọng, nói lắp</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* CỘT GIỮA (4/12): KHÁM MẮT */}
                <div className="col-span-12 lg:col-span-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2 uppercase text-sm flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-xs">3</span> Khúc xạ & Thị lực
                    </h3>
                    <p className="text-[11px] text-blue-600/70 mb-5 font-medium pb-4 border-b border-blue-200">
                        * Cận nhập số âm (-), Viễn nhập số dương (+). Đơn vị đi-ốp. Cận/Viễn tối đa 3D. Loạn thị &lt; 1D.
                    </p>

                    <div className="space-y-4">
                        {/* MẮT TRÁI */}
                        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <span className="font-bold text-sm text-slate-800 mb-3 block pl-2">MẮT TRÁI</span>
                            <div className="space-y-3 pl-2">
                                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Độ Cận/Viễn</label>
                                        <input type="number" step="0.25" name="sphereLeft" value={formData.sphereLeft} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Độ Loạn</label>
                                        <input type="number" step="0.25" min="0" name="cylinderLeft" value={formData.cylinderLeft} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 h-7">Thị lực<br />MẮT THƯỜNG</label>
                                        <input type="number" min="0" max="10" name="visionLeftNoGlass" value={formData.visionLeftNoGlass} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center text-blue-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 h-7">Thị lực<br />ĐEO KÍNH</label>
                                        <input type="number" min="0" max="10" name="visionLeftWithGlass" value={formData.visionLeftWithGlass} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center text-blue-800 disabled:opacity-50" disabled={formData.sphereLeft == 0 && formData.cylinderLeft == 0} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MẮT PHẢI */}
                        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <span className="font-bold text-sm text-slate-800 mb-3 block pl-2">MẮT PHẢI</span>
                            <div className="space-y-3 pl-2">
                                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Độ Cận/Viễn</label>
                                        <input type="number" step="0.25" name="sphereRight" value={formData.sphereRight} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Độ Loạn</label>
                                        <input type="number" step="0.25" min="0" name="cylinderRight" value={formData.cylinderRight} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 h-7">Thị lực<br />MẮT THƯỜNG</label>
                                        <input type="number" min="0" max="10" name="visionRightNoGlass" value={formData.visionRightNoGlass} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center text-blue-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 h-7">Thị lực<br />ĐEO KÍNH</label>
                                        <input type="number" min="0" max="10" name="visionRightWithGlass" value={formData.visionRightWithGlass} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center text-blue-800 disabled:opacity-50" disabled={formData.sphereRight == 0 && formData.cylinderRight == 0} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI (5/12): CHỈ SỐ ĐẶC THÙ (XĂM, KHUYÊN...) */}
                <div className="col-span-12 lg:col-span-5 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                    <h3 className="font-bold text-orange-900 mb-5 border-b border-orange-200 pb-3 uppercase text-sm flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-orange-500 text-white flex items-center justify-center text-xs">4</span> Đặc thù (Xăm, Khuyên, Da)
                    </h3>

                    <div className="space-y-5">
                        {/* BOX: XEM XÉT CƠ BẢN */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold bg-white p-3 rounded-xl border border-orange-200 shadow-sm">
                            <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-orange-50 cursor-pointer transition"><input type="checkbox" name="drugUse" checked={formData.drugUse} onChange={handleChange} className="w-3.5 h-3.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500" /><span className="text-slate-700">Nghiện ma túy</span></label>
                            <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-orange-50 cursor-pointer transition"><input type="checkbox" name="hairColorIssue" checked={formData.hairColorIssue} onChange={handleChange} className="w-3.5 h-3.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500" /><span className="text-slate-700">Nhuộm tóc sai quy định</span></label>
                            <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-orange-50 cursor-pointer transition"><input type="checkbox" name="skinPigmentation" checked={formData.skinPigmentation} onChange={handleChange} className="w-3.5 h-3.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500" /><span className="text-slate-700">Rối loạn sắc tố da</span></label>
                            <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-orange-50 cursor-pointer transition"><input type="checkbox" name="keloids" checked={formData.keloids} onChange={handleChange} className="w-3.5 h-3.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500" /><span className="text-slate-700">Sẹo lồi vùng hở</span></label>
                        </div>

                        {/* BOX: XĂM HÌNH */}
                        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 overflow-hidden">
                            <label className="flex items-center space-x-3 font-extrabold text-sm text-slate-800 cursor-pointer">
                                <input type="checkbox" name="hasTattoo" checked={formData.hasTattoo} onChange={handleChange} className="w-5 h-5 text-orange-600 rounded border-slate-300 focus:ring-orange-500" />
                                <span>CÓ VẾT TRỔ / XĂM TRÊN DA</span>
                            </label>

                            {formData.hasTattoo && (
                                <div className="mt-4 pl-4 space-y-4 border-l-2 border-orange-300 animate-in slide-in-from-top-2 duration-200">
                                    <label className="flex items-start space-x-3 text-xs p-2 bg-rose-50 rounded-lg cursor-pointer hover:bg-rose-100 transition">
                                        <input type="checkbox" name="tattooContentOffensive" checked={formData.tattooContentOffensive} onChange={handleChange} className="w-4 h-4 text-rose-600 mt-0.5 rounded focus:ring-rose-500" />
                                        <span className="text-rose-800 font-bold leading-snug">Nội dung phản cảm, chống phá, bạo lực, kỳ dị</span>
                                    </label>

                                    <div className="text-xs">
                                        <label className="block mb-1.5 font-bold text-slate-600 uppercase">Vị trí hình xăm:</label>
                                        <select name="tattooLocation" value={formData.tattooLocation} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-400 font-medium">
                                            <option value="hidden">Vùng Kín (Lưng, ngực, bụng, đùi trên...)</option>
                                            <option value="exposed">Lộ Diện (Mặt, đầu, cổ, tay dưới, chân dưới...)</option>
                                        </select>
                                    </div>

                                    {formData.tattooLocation === 'exposed' && (
                                        <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <span className="font-bold text-slate-700 uppercase">Số lượng hình xăm:</span>
                                            <input type="number" min="1" name="tattooCount" value={formData.tattooCount} onChange={handleChange} className="w-24 p-2 border border-slate-200 rounded-md text-center font-bold outline-none focus:border-orange-400" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="font-bold text-slate-700 uppercase">Tổng diện tích:</span>
                                        <div className="relative">
                                            <input type="number" name="tattooSize" value={formData.tattooSize} onChange={handleChange} className="w-24 p-2 pl-3 pr-10 border border-slate-200 rounded-md text-right font-bold outline-none focus:border-orange-400" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">cm²</span>
                                        </div>
                                    </div>

                                    {formData.tattooLocation === 'hidden' && (
                                        <label className="flex items-start space-x-3 text-xs bg-orange-50/50 p-2.5 rounded-lg cursor-pointer hover:bg-orange-50 transition border border-orange-100">
                                            <input type="checkbox" name="tattooCoverHalfBody" checked={formData.tattooCoverHalfBody} onChange={handleChange} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                                            <span className="text-slate-800 font-semibold leading-snug">Chiếm từ 1/2 diện tích Lưng / Ngực / Bụng trở lên</span>
                                        </label>
                                    )}
                                    <p className="text-[10px] text-orange-600/80 font-medium italic">* Vùng lộ diện cho phép tối đa 01 hình & diện tích ≤ 2cm².</p>
                                </div>
                            )}
                        </div>

                        {/* BOX: XỎ KHUYÊN */}
                        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 overflow-hidden">
                            <label className="flex items-center space-x-3 font-extrabold text-sm text-slate-800 cursor-pointer">
                                <input type="checkbox" name="hasPiercing" checked={formData.hasPiercing} onChange={handleChange} className="w-5 h-5 text-orange-600 rounded border-slate-300 focus:ring-orange-500" />
                                <span>CÓ LỖ XỎ KHUYÊN / BẤM LỖ</span>
                            </label>

                            {formData.hasPiercing && (
                                <div className="mt-4 pl-4 space-y-4 border-l-2 border-orange-300 animate-in slide-in-from-top-2 duration-200 text-xs">
                                    <div>
                                        <label className="block mb-1.5 font-bold text-slate-600 uppercase">Vị trí xỏ khuyên:</label>
                                        <select name="piercingLocation" value={formData.piercingLocation} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-400 font-medium">
                                            <option value="ear">Ở Tai</option>
                                            <option value="other">Vị trí khác (Mũi, rốn, mày, lưỡi...)</option>
                                        </select>
                                    </div>

                                    {formData.piercingLocation === 'ear' && formData.gender === 'Nam' && (
                                        <label className="flex items-center space-x-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-50 transition">
                                            <input type="checkbox" name="piercingHealed" checked={formData.piercingHealed} onChange={handleChange} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                                            <span className="font-bold text-emerald-800">Lỗ bấm tai đã liền thành sẹo</span>
                                        </label>
                                    )}

                                    {formData.piercingLocation === 'ear' && formData.gender === 'Nữ' && (
                                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <span className="font-bold text-slate-700 uppercase">Số lỗ bấm trên MỘT tai:</span>
                                            <input type="number" min="1" max="5" name="piercingCountPerEar" value={formData.piercingCountPerEar} onChange={handleChange} className="w-16 p-2 border border-slate-200 rounded text-center font-bold outline-none focus:border-orange-400" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOX KẾT QUẢ ĐÁNH GIÁ */}
            <div className={`p-8 rounded-2xl border-2 shadow-sm ${result.passed ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50'}`}>
                <div className="flex items-center space-x-5 mb-6">
                    <div className="text-6xl drop-shadow-md transition-transform hover:scale-110">
                        {result.passed ? '👮‍♂️ ✅' : '⚠️ ❌'}
                    </div>
                    <div>
                        <h3 className={`text-2xl lg:text-3xl font-black tracking-tight uppercase ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {result.passed ? 'ĐỦ ĐIỀU KIỆN SỨC KHỎE' : 'CHƯA ĐẠT CHUẨN'}
                        </h3>
                        <p className={`text-sm mt-1 font-semibold ${result.passed ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
                            DỰ ĐOÁN TỰ ĐỘNG DỰA TRÊN THÔNG TƯ 131/2025/TT-BCA
                        </p>
                    </div>
                </div>

                <div className="bg-white/90 p-5 rounded-xl shadow-sm border border-slate-200/60">
                    <ul className="space-y-3 text-[15px]">
                        {result.messages.map((msg, idx) => {
                            const fails = msg.includes('❌');
                            return (
                                <li key={idx} className={`flex items-start ${fails ? 'text-rose-700 font-bold' : 'text-emerald-800 font-medium'}`}>
                                    <span className={`mr-2 flex-shrink-0 text-lg ${fails ? '' : ''}`}>
                                        {fails ? '•' : '✓'}
                                    </span>
                                    <span className="leading-snug pt-1">{msg.replace(/[❌✅]/g, '').trim()}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <p className="mt-6 text-xs text-slate-500/80 italic font-medium leading-relaxed">
                    * Tuân thủ Thông tư 131/2025/TT-BCA (sửa đổi, bổ sung Thông tư 62/2023/TT-BCA) của Bộ Công an. Quyết định chính thức phụ thuộc vào Hội đồng khám sức khỏe y tế tại địa phương tương ứng với chỉ tiêu tuyển sinh hiện tại. Mọi đánh giá tại website này chỉ mang tính tham khảo nhanh.
                </p>
            </div>
        </div>
    );
};

export default HealthCheckCAND;