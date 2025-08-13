import { jsPDF } from "jspdf";
import { quizQuestions } from "@/lib/quizData";

interface QuizResult {
  id: string;
  created_at: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  gender: string;
  score: number;
  status: 'pending' | 'approved' | 'redo_required';
  answers: { [key: string]: string };
}

export const generateQuizPdf = (result: QuizResult) => {
  const doc = new jsPDF();
  let y = 20; // Initial Y position

  // --- QUAN TRỌNG: Để hỗ trợ đầy đủ ký tự tiếng Việt, bạn cần nhúng một font tùy chỉnh. ---
  // 1. Lấy một file font .ttf có hỗ trợ tiếng Việt (ví dụ: Noto Sans, Roboto).
  // 2. Chuyển đổi file .ttf đó thành chuỗi base64. Bạn có thể dùng các công cụ trực tuyến
  //    hoặc công cụ fontconverter của jspdf (ví dụ: https://raw.githack.com/MrRio/jsPDF/master/fontconverter/fontconverter.html).
  // 3. Thêm font vào Hệ thống File ảo (VFS) của jsPDF và đăng ký nó:
  //    const FONT_BASE64 = "CHUỖI_FONT_BASE64_CỦA_BẠN_Ở_ĐÂY";
  //    doc.addFileToVFS('MyVietnameseFont.ttf', FONT_BASE64);
  //    doc.addFont('MyVietnameseFont.ttf', 'MyVietnameseFont', 'normal');
  // 4. Sau đó, đặt font: doc.setFont('MyVietnameseFont');
  // Hiện tại, chúng tôi đang sử dụng một font mặc định có thể không hỗ trợ đầy đủ ký tự tiếng Việt để tránh lỗi.
  doc.setFont("helvetica"); // Sử dụng font tích hợp để ngăn lỗi 'widths'
  // ---------------------------------------------------------------------------------------

  // Tiêu đề
  doc.setFontSize(20);
  doc.text("KẾT QUẢ BÀI KIỂM TRA", 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(12);
  doc.text("Thông tư 07/2014/TT-BYT", 105, y, { align: "center" });
  y += 20;

  // Thông tin cá nhân
  doc.setFontSize(14);
  doc.text("THÔNG TIN CÁ NHÂN", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Họ và tên: ${result.full_name}`, 20, y);
  y += 7;
  doc.text(`Ngày sinh: ${new Date(result.date_of_birth).toLocaleDateString('vi-VN')}`, 20, y);
  y += 7;
  doc.text(`Giới tính: ${result.gender}`, 20, y);
  y += 7;
  doc.text(`Số điện thoại: ${result.phone_number}`, 20, y);
  y += 7;
  doc.text(`Ngày làm bài: ${new Date(result.created_at).toLocaleString('vi-VN')}`, 20, y);
  y += 15;

  // Điểm số
  doc.setFontSize(16);
  doc.text(`Điểm số: ${result.score.toFixed(1)} / 10`, 20, y);
  y += 15;

  // Câu hỏi và đáp án
  doc.setFontSize(14);
  doc.text("CÂU HỎI VÀ ĐÁP ÁN", 20, y);
  y += 10;

  doc.setFontSize(12);
  quizQuestions.forEach((q, index) => {
    const userAnswer = result.answers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;

    // Kiểm tra nếu cần trang mới
    if (y + 50 > doc.internal.pageSize.height - 20) { // Ước tính không gian cần cho một câu hỏi
      doc.addPage();
      y = 20;
      doc.setFont("helvetica"); // Đặt lại font sau khi thêm trang
      doc.setFontSize(12);
    }

    doc.text(`Câu ${index + 1}: ${q.question}`, 20, y);
    y += 7;

    Object.entries(q.options).forEach(([key, value]) => {
      let optionText = `${key}. ${value}`;
      if (key === q.correctAnswer) {
        optionText += " (Đáp án đúng)";
      }
      doc.text(optionText, 25, y);
      y += 7;
    });

    doc.text(`Bạn đã chọn: ${userAnswer || "Không trả lời"}`, 25, y);
    y += 7;
    doc.text(`Kết quả: ${isCorrect ? "Đúng" : "Sai"}`, 25, y);
    y += 10; // Khoảng cách giữa các câu hỏi
  });

  doc.save(`KetQuaKiemTra_${result.full_name}.pdf`);
};