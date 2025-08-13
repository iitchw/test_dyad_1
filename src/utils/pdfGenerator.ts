import { jsPDF } from "jspdf";
import { quizQuestions } from "@/lib/quizData";
import { robotoBase64 } from "@/lib/fonts/Roboto-Regular-base64";

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

  // Add the custom font to the virtual file system
  doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
  // Add the font to jsPDF
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  // Set the font for the entire document
  doc.setFont('Roboto');

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

    // Split long questions to fit the page width
    const questionLines = doc.splitTextToSize(`Câu ${index + 1}: ${q.question}`, 170);
    
    // Check if new page is needed
    const questionBlockHeight = (questionLines.length + Object.keys(q.options).length + 3) * 7;
    if (y + questionBlockHeight > doc.internal.pageSize.height - 20) {
      doc.addPage();
      y = 20;
      doc.setFont('Roboto'); // Reset font after adding page
      doc.setFontSize(12);
    }

    doc.text(questionLines, 20, y);
    y += questionLines.length * 7;

    Object.entries(q.options).forEach(([key, value]) => {
      const optionLines = doc.splitTextToSize(`${key}. ${value}`, 165);
      let optionText = `${key}. ${value}`;
      if (key === q.correctAnswer) {
        optionText += " (Đáp án đúng)";
      }
      doc.text(doc.splitTextToSize(optionText, 165), 25, y);
      y += doc.splitTextToSize(optionText, 165).length * 7;
    });

    doc.text(`Bạn đã chọn: ${userAnswer || "Không trả lời"}`, 25, y);
    y += 7;
    doc.text(`Kết quả: ${isCorrect ? "Đúng" : "Sai"}`, 25, y);
    y += 10; // Khoảng cách giữa các câu hỏi
  });

  doc.save(`KetQuaKiemTra_${result.full_name}.pdf`);
};