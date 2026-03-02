const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/['"]/g, '');
            process.env[key] = val;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing DB credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = [
    {
        "id": "ANH",
        "name": "Học viện An ninh nhân dân",
        "code": "T01",
        "address": "125 Trần Phú, Văn Quán, Hà Đông, Hà Nội",
        "region": "North",
        "type": "Academy",
        "description": "Đào tạo sĩ quan nghiệp vụ An ninh, An toàn thông tin và An ninh mạng. Trọng tâm bảo vệ an ninh quốc gia.",
        "major_groups": ["Nghiệp vụ An ninh", "An ninh mạng", "Y khoa (Gửi đào tạo)"],
        "subjects": ["A00", "A01", "C03", "D01", "CA1", "CA2"],
        "website": "https://hvannd.edu.vn"
    },
    {
        "id": "CSH",
        "name": "Học viện Cảnh sát nhân dân",
        "code": "T02",
        "address": "Phường Cổ Nhuế 2, Quận Bắc Từ Liêm, Hà Nội",
        "region": "North",
        "type": "Academy",
        "description": "Đào tạo cán bộ thực hiện nhiệm vụ bảo đảm trật tự, an toàn xã hội và đấu tranh phòng chống tội phạm.",
        "major_groups": ["Nghiệp vụ Cảnh sát"],
        "subjects": ["A00", "A01", "C03", "D01", "CA1", "CA2"],
        "website": "https://hvcsnd.edu.vn"
    },
    {
        "id": "HCA",
        "name": "Học viện Chính trị Công an nhân dân",
        "code": "T03",
        "address": "Xã Tiên Dược, Huyện Sóc Sơn, Hà Nội",
        "region": "National",
        "type": "Academy",
        "description": "Đào tạo cán bộ làm công tác Đảng, công tác chính trị, tham mưu chỉ huy trong lực lượng CAND.",
        "major_groups": ["Xây dựng Đảng & Chính quyền nhà nước"],
        "subjects": ["A01", "C03", "D01", "CA1", "CA2"],
        "website": "https://hvctcand.edu.vn"
    },
    {
        "id": "ANS",
        "name": "Trường Đại học An ninh nhân dân",
        "code": "T04",
        "address": "Km18, Xa lộ Hà Nội, Linh Trung, TP. Thủ Đức, TP.HCM",
        "region": "South",
        "type": "University",
        "description": "Đào tạo sĩ quan An ninh cho các tỉnh phía Nam (từ Đà Nẵng trở vào).",
        "major_groups": ["Nghiệp vụ An ninh"],
        "subjects": ["A00", "A01", "C03", "D01", "CA1", "CA2"],
        "website": "https://dhannd.edu.vn"
    },
    {
        "id": "CSS",
        "name": "Trường Đại học Cảnh sát nhân dân",
        "code": "T05",
        "address": "36 Nguyễn Hữu Thọ, Tân Phong, Quận 7, TP.HCM",
        "region": "South",
        "type": "University",
        "description": "Đào tạo nghiệp vụ Cảnh sát cho khu vực phía Nam.",
        "major_groups": ["Nghiệp vụ Cảnh sát"],
        "subjects": ["A00", "A01", "C03", "D01", "CA1", "CA2"],
        "website": "https://dhcsnd.edu.vn"
    },
    {
        "id": "PCC",
        "name": "Trường Đại học Phòng cháy chữa cháy",
        "code": "T06",
        "address": "243 Khuất Duy Tiến, Thanh Xuân, Hà Nội",
        "region": "National",
        "type": "University",
        "description": "Đào tạo chuyên gia PCCC, cứu nạn cứu hộ và quản lý nhà nước về an ninh trật tự.",
        "major_groups": ["PCCC & Cứu nạn cứu hộ"],
        "subjects": ["A00", "CA1"],
        "website": "http://daihocpccc.bocongan.gov.vn"
    },
    {
        "id": "HCB",
        "name": "Trường Đại học Kỹ thuật - Hậu cần CAND",
        "code": "T07",
        "address": "Thị trấn Hồ, Thuận Thành, Bắc Ninh",
        "region": "National",
        "type": "University",
        "description": "Đào tạo kỹ thuật nghiệp vụ, hậu cần, tài chính và công nghệ phục vụ chiến đấu.",
        "major_groups": ["Hậu cần CAND", "Kỹ thuật - Công nghệ an ninh"],
        "subjects": ["A00", "A01", "CA1"],
        "website": "http://dhkthccand.edu.vn"
    },
    {
        "id": "AIS",
        "name": "Học viện Quốc tế",
        "code": "B06",
        "address": "Thanh Liệt, Thanh Trì, Hà Nội",
        "region": "National",
        "type": "Academy",
        "description": "Đào tạo chuyên sâu về ngoại ngữ và quan hệ quốc tế, phục vụ công tác đối ngoại và hợp tác quốc tế của lực lượng CAND.",
        "major_groups": ["Ngôn ngữ Anh", "Ngôn ngữ Trung Quốc"],
        "subjects": ["D01", "D04", "CA1", "CA2"],
        "website": "https://tongdaituyensinhcand.vn"
    },
    {
        "id": "CA1",
        "name": "Trường Cao đẳng An ninh nhân dân I",
        "code": "T08",
        "address": "Sóc Sơn, Hà Nội (CS Bắc) & Biên Hòa, Đồng Nai (CS Nam)",
        "region": "National",
        "type": "College",
        "description": "Đào tạo hệ trung cấp chính quy chuyên ngành Trinh sát an ninh cho toàn quốc.",
        "major_groups": ["Trinh sát An ninh"],
        "subjects": ["Xét tuyển từ điểm THPT", "Chiến sĩ nghĩa vụ"],
        "website": "https://cdannd1.bocongan.gov.vn"
    },
    {
        "id": "CC1",
        "name": "Trường Cao đẳng Cảnh sát nhân dân I",
        "code": "T09",
        "address": "Thủy Xuân Tiên, Chương Mỹ, Hà Nội",
        "region": "North",
        "type": "College",
        "description": "Đào tạo hệ trung cấp nghiệp vụ Cảnh sát nhân dân cho khu vực phía Bắc.",
        "major_groups": ["Nghiệp vụ Cảnh sát"],
        "subjects": ["Xét tuyển từ điểm THPT", "Chiến sĩ nghĩa vụ"],
        "website": "https://cdcsnd1.bocongan.gov.vn"
    },
    {
        "id": "CC2",
        "name": "Trường Cao đẳng Cảnh sát nhân dân II",
        "code": "T10",
        "address": "247 Đặng Văn Bi, Trường Thọ, Thủ Đức, TP.HCM",
        "region": "South",
        "type": "College",
        "description": "Đào tạo hệ trung cấp nghiệp vụ Cảnh sát nhân dân cho khu vực phía Nam.",
        "major_groups": ["Nghiệp vụ Cảnh sát"],
        "subjects": ["Xét tuyển từ điểm THPT", "Chiến sĩ nghĩa vụ"],
        "website": "http://caodangcsnd2.edu.vn"
    },
    {
        "id": "VH1",
        "name": "Trường Văn hóa Công an nhân dân",
        "code": "T11",
        "address": "Xã Lương Sơn, TP. Thái Nguyên, tỉnh Thái Nguyên",
        "region": "National",
        "type": "High School",
        "description": "Đào tạo văn hóa bậc THPT cho con em đồng bào dân tộc thiểu số và học sinh thuộc diện chính sách của CAND để tạo nguồn.",
        "major_groups": ["Văn hóa THPT"],
        "subjects": ["Tuyển thẳng", "Xét tuyển nội bộ"],
        "website": ""
    }
];

const mappedData = rawData.map(item => ({
    ...item,
    major_groups: item.major_groups.join(', '),
    subjects: item.subjects.join(', ')
}));

async function seed() {
    console.log(`Seeding ${mappedData.length} records...`);

    const { data, error } = await supabase.from('schools').upsert(mappedData, { onConflict: 'id' });

    if (error) {
        console.error('Error seeding data:', error);
    } else {
        console.log('Seed completed successfully!');
    }
}

seed();
