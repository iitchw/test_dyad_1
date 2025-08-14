import { jsPDF } from "jspdf";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";

let isFontInitialized = false;

const initializePdfFont = async () => {
  if (isFontInitialized) return;
  if (typeof window !== 'undefined') {
    window.jsPDF = jsPDF;
    await import('./fonts/Roboto-normal.js');
    isFontInitialized = true;
  }
};

interface Question {
  id: string;
  question_text: string;
  options: { [key: string]: string };
  correct_answer: string;
}

interface QuizResultWithQuestions {
  id: string;
  created_at: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  gender: string;
  workplace: string;
  score: number;
  status: 'pending' | 'approved' | 'redo_required';
  answers: { [key: string]: string };
  questions: Question[]; // Questions are now passed in
}

export const generatePdfFromQuizResult = async (result: QuizResultWithQuestions, fileName: string) => {
  const loadingToast = showLoading("Đang tạo file PDF...");

  try {
    await initializePdfFont();

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.addFont('Roboto-normal.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    doc.setTextColor(0, 0, 0);

    let y = 20;
    const margin = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("KẾT QUẢ BÀI KIỂM TRA", pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text("Thông tin cá nhân", margin, y);
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(`Họ và tên: ${result.full_name}`, margin, y);
    y += lineHeight;
    doc.text(`Ngày sinh: ${new Date(result.date_of_birth).toLocaleDateString('vi-VN')}`, margin, y);
    y += lineHeight;
    doc.text(`Giới tính: ${result.gender}`, margin, y);
    y += lineHeight;
    doc.text(`Đơn vị công tác: ${result.workplace}`, margin, y);
    y += lineHeight;
    doc.text(`Ngày làm bài: ${new Date(result.created_at).toLocaleString('vi-VN')}`, margin, y);
    y += lineHeight * 1.5;
    doc.setFontSize(16);
    doc.text(`Điểm số: ${result.score.toFixed(1)}/10`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text("Câu hỏi và đáp án", margin, y);
    y += lineHeight * 1.5;

    result.questions.forEach((q, index) => {
      const userAnswer = result.answers[q.id];
      const questionText = `Câu ${index + 1}: ${q.question_text}`;
      const optionsText = Object.entries(q.options).map(([key, value]) => `${key}. ${value}`).join('\n');
      const answerText = `Bạn đã chọn: ${userAnswer || "Không trả lời"}\nĐáp án đúng: ${q.correct_answer}`;
      
      const questionLines = doc.splitTextToSize(questionText, pageWidth - (margin * 2));
      const optionsLines = doc.splitTextToSize(optionsText, pageWidth - (margin * 2) - 5);
      const answerLines = doc.splitTextToSize(answerText, pageWidth - (margin * 2));

      const estimatedHeight = (questionLines.length + optionsLines.length + answerLines.length) * lineHeight + (lineHeight * 2);

      if (y + estimatedHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(12);
      doc.text(questionLines, margin, y);
      y += (questionLines.length * lineHeight);

      doc.text(optionsLines, margin + 5, y);
      y += (optionsLines.length * lineHeight);
      
      y += lineHeight * 0.5;
      doc.text(answerLines, margin, y);
      y += (answerLines.length * lineHeight) + (lineHeight * 1.5);
    });

    doc.save(`${fileName}.pdf`);
    
    dismissToast(loadingToast);
    showSuccess("Đã tạo file PDF thành công!");

  } catch (err) {
    dismissToast(loadingToast);
    showError("Đã xảy ra lỗi khi tạo PDF.");
    console.error("Lỗi tạo PDF:", err);
  }
};