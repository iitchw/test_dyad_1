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

  // Set font for Vietnamese characters
  doc.addFont("ArialUnicodeMS", "Arial", "normal");
  doc.setFont("Arial");

  // Title
  doc.setFontSize(20);
  doc.text("KẾT QUẢ BÀI KIỂM TRA", 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(12);
  doc.text("Thông tư 07/2014/TT-BYT", 105, y, { align: "center" });
  y += 20;

  // Personal Information
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

  // Score
  doc.setFontSize(16);
  doc.text(`Điểm số: ${result.score.toFixed(1)} / 10`, 20, y);
  y += 15;

  // Questions and Answers
  doc.setFontSize(14);
  doc.text("CÂU HỎI VÀ ĐÁP ÁN", 20, y);
  y += 10;

  doc.setFontSize(12);
  quizQuestions.forEach((q, index) => {
    const userAnswer = result.answers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;

    // Check if new page is needed
    if (y + 50 > doc.internal.pageSize.height - 20) { // Estimate space needed for a question
      doc.addPage();
      y = 20;
      doc.setFont("Arial"); // Reset font after adding page
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
    y += 10; // Space between questions
  });

  doc.save(`KetQuaKiemTra_${result.full_name}.pdf`);
};