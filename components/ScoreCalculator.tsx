'use client'

import { useState, useEffect } from 'react'
import { Calculator, ChevronDown, ChevronUp, GraduationCap, AlertCircle, Info } from 'lucide-react'

interface ScoreResult {
  tongDiemThi: number
  diemCongThucTe: number
  diemXetTuyen: number
  bcaConverted: number
  kvApplied: boolean
  kvWarning: string
  diemCongGoc: number
}

export default function ScoreCalculator() {
  const currentYear = new Date().getFullYear()

  const [isOpen, setIsOpen] = useState(false)
  const [namGrad, setNamGrad] = useState(currentYear.toString())
  const [m1, setM1] = useState('')
  const [m2, setM2] = useState('')
  const [m3, setM3] = useState('')
  const [btbca, setBtbca] = useState('')
  const [thangDiem, setThangDiem] = useState('30')
  const [kv, setKv] = useState('0.75')
  const [dt, setDt] = useState('0')
  const [dth, setDth] = useState('0')
  const [result, setResult] = useState<ScoreResult | null>(null)

  const handleScoreChange = (setter: React.Dispatch<React.SetStateAction<string>>, maxVal: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setter(val);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= maxVal) {
      setter(val);
    } else if (num > maxVal) {
      // Báo lỗi bằng cách chặn và gán bằng max
      setter(maxVal.toString());
    }
  }

  // Auto-set graduation year on mount
  useEffect(() => {
    setNamGrad(currentYear.toString())
  }, [currentYear])

  const tinhDiem = () => {
    const namGradVal = parseInt(namGrad) || currentYear
    const m1Val = parseFloat(m1) || 0
    const m2Val = parseFloat(m2) || 0
    const m3Val = parseFloat(m3) || 0
    let bcaVal = parseFloat(btbca) || 0
    const dtVal = parseFloat(dt)
    const dthVal = parseFloat(dth)

    // 1. Logic KV: chi duoc huong neu tot nghiep nam hien tai hoac nam truoc (toi da 1 nam)
    const yearsDiff = currentYear - namGradVal
    let kvVal = parseFloat(kv)
    let kvApplied = true
    let kvWarning = ''

    if (yearsDiff > 1) {
      kvVal = 0
      kvApplied = false
      kvWarning = `Tot nghiep nam ${namGradVal} (> 2 nam) - Khong duoc cong diem KV`
    } else {
      kvWarning = `Tot nghiep nam ${namGradVal} - Duoc cong ${kvVal}d KV`
    }

    // 2. Quy doi diem BCA ve thang 30 neu can
    let bcaConverted = bcaVal
    if (thangDiem === '100') {
      bcaConverted = bcaVal * 0.3
    }

    // 3. Tinh tong diem thi: (M1+M2+M3)*2/5 + BCA*3/5
    let tongDiemThi = (m1Val + m2Val + m3Val) * 0.4 + bcaConverted * 0.6
    tongDiemThi = Math.round(tongDiemThi * 100) / 100

    // 4. Tinh diem cong (co xet giam tru neu tong diem >= 22.5)
    const diemCongGoc = kvVal + dtVal + dthVal
    let diemCongThucTe = diemCongGoc

    if (tongDiemThi >= 22.5) {
      diemCongThucTe = ((30 - tongDiemThi) / 7.5) * diemCongGoc
    }
    diemCongThucTe = Math.round(diemCongThucTe * 100) / 100

    // 5. Tinh diem xet tuyen
    const diemXetTuyen = Math.round((tongDiemThi + diemCongThucTe) * 100) / 100

    setResult({
      tongDiemThi,
      diemCongThucTe,
      diemXetTuyen,
      bcaConverted,
      kvApplied,
      kvWarning,
      diemCongGoc
    })
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/80 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-police-light to-police-dark flex items-center justify-center shadow-lg shadow-police-light/30">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
              Tính điểm xét tuyển
            </h3>
            <p className="text-xs text-slate-500">Phương thức 3 - Tự động theo năm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">
            {isOpen ? 'Thu gọn' : 'Mở rộng'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-100">
          <div className="pt-4 space-y-4">
            {/* Nam tot nghiep */}
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-police-light" />
                <span className="text-sm font-semibold text-slate-700">Năm tuyển sinh hiện tại: {currentYear}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Năm tốt nghiệp THPT của bạn
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={namGrad}
                  onChange={(e) => setNamGrad(e.target.value)}
                  placeholder={`Ví dụ: ${currentYear}`}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light font-medium"
                />
                <p className="text-xs text-slate-500 mt-1">
                  * Chỉ được cộng điểm KV nếu tốt nghiệp năm {currentYear} hoặc {currentYear - 1}
                </p>
              </div>
            </div>

            {/* Điểm thi THPT */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-police-light" />
                Điểm thi THPT (thang 10)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Môn 1 (M1)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.25"
                    value={m1}
                    onChange={handleScoreChange(setM1, 10)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Môn 2 (M2)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.25"
                    value={m2}
                    onChange={handleScoreChange(setM2, 10)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Môn 3 (M3)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.25"
                    value={m3}
                    onChange={handleScoreChange(setM3, 10)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light"
                  />
                </div>
              </div>
            </div>

            {/* Điểm thi BCA với chọn thang điểm */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Điểm bài thi Bộ Công an
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={btbca}
                  onChange={handleScoreChange(setBtbca, parseFloat(thangDiem))}
                  placeholder="Nhập điểm..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light"
                />
                <select
                  value={thangDiem}
                  onChange={(e) => {
                    const newMax = e.target.value;
                    setThangDiem(newMax);
                    if (parseFloat(btbca) > parseFloat(newMax)) {
                      setBtbca(newMax);
                    }
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light w-32"
                >
                  <option value="30">Thang 30</option>
                  <option value="100">Thang 100</option>
                </select>
              </div>
              {result && thangDiem === '100' && (
                <p className="text-xs text-police-light mt-1">
                  → Quy đổi: {result.bcaConverted.toFixed(2)}/30
                </p>
              )}
            </div>

            {/* Điểm ưu tiên */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Khu vực (KV)
                  <span className="text-xs text-amber-600 ml-1">*</span>
                </label>
                <select
                  value={kv}
                  onChange={(e) => setKv(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light"
                >
                  <option value="0.75">KV1 (0.75)</option>
                  <option value="0.5">KV2-NT (0.5)</option>
                  <option value="0.25">KV2 (0.25)</option>
                  <option value="0">KV3 (0)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Đối tượng (ĐT)</label>
                <select
                  value={dt}
                  onChange={(e) => setDt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light"
                >
                  <option value="0">Không có (0)</option>
                  <option value="2.0">Nhóm 1,2,3,4 (2.0)</option>
                  <option value="1.0">Nhóm 5,6,7 (1.0)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Điểm thưởng (Đth)</label>
                <select
                  value={dth}
                  onChange={(e) => setDth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light"
                >
                  <option value="0">Không có (0)</option>
                  <option value="1.0">Nhất/Vàng (1.0)</option>
                  <option value="0.75">Nhì/Bạc (0.75)</option>
                  <option value="0.5">Ba/Đồng (0.5)</option>
                  <option value="0.25">KK (0.25)</option>
                </select>
              </div>
            </div>

            {/* Nút tính điểm */}
            <button
              onClick={tinhDiem}
              className="w-full py-3.5 bg-gradient-to-r from-police-dark to-police-light text-white font-bold rounded-xl shadow-lg shadow-police-light/30 hover:shadow-xl hover:shadow-police-light/40 transition-all active:scale-[0.98] text-lg"
            >
              TÍNH ĐIỂM XÉT TUYỂN
            </button>

            {/* Kết quả */}
            {result && (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Kết quả tính toán
                </h4>

                {/* KV Warning */}
                {!result.kvApplied && (
                  <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{result.kvWarning}</p>
                  </div>
                )}
                {result.kvApplied && parseFloat(kv) > 0 && (
                  <div className="flex items-start gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700">{result.kvWarning}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                    <span className="text-sm text-slate-600">Tổng điểm 3 môn THPT:</span>
                    <span className="font-semibold text-slate-800">{(parseFloat(m1 || '0') + parseFloat(m2 || '0') + parseFloat(m3 || '0')).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                    <span className="text-sm text-slate-600">Điểm BCA (quy đổi/30):</span>
                    <span className="font-semibold text-slate-800">{result.bcaConverted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                    <span className="text-sm text-slate-600">Tổng điểm thi (chưa cộng):</span>
                    <span className="text-lg font-bold text-slate-800">{result.tongDiemThi.toFixed(2)}</span>
                  </div>

                  {result.diemCongGoc !== result.diemCongThucTe && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                      <span className="text-sm text-slate-600">Điểm cộng gốc:</span>
                      <span className="text-slate-500 line-through">{result.diemCongGoc.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                    <span className="text-sm text-slate-600">Điểm cộng thực nhận:</span>
                    <span className="text-lg font-bold text-slate-800">{result.diemCongThucTe.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center py-4 bg-white rounded-xl px-4 shadow-md border border-police-light/20">
                    <span className="text-base font-bold text-slate-700">Điểm xét tuyển:</span>
                    <span className="text-3xl font-extrabold text-police-dark">{result.diemXetTuyen.toFixed(2)}</span>
                  </div>
                </div>

                {result.tongDiemThi >= 22.5 && (
                  <p className="text-xs text-amber-600 mt-4 italic bg-amber-50 p-2 rounded-lg">
                    * Áp dụng luật giảm trừ điểm cộng vì tổng điểm thi &gt;= 22.5
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
