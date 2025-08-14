import { jsPDF } from "jspdf";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";
import { quizQuestions } from "@/lib/quizData";
// Import the font file
import './fonts/Roboto-VariableFont_wdth,wght-normal'; // This import registers the font with jsPDF

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

export const generatePdfFromQuizResult = async (result: QuizResult, fileName: string) => {
  const loadingToast = showLoading("Đang tạo file PDF...");

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Register and set the custom font for Vietnamese support
    // The font is already added to VFS by the import statement if it's a jsPDF font file.
    doc.addFont('Roboto-VariableFont_wdth,wght-normal.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    doc.setTextColor(0, 0, 0); // Black color

    let y = 20; // Initial Y position
    const margin = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header ---
    doc.setFontSize(18);
    doc.text("KẾT QUẢ BÀI KIỂM TRA", pageWidth / 2, y, { align: 'center' });
    y += lineHeight;
    doc.setFontSize(12);
    doc.text("Thông tư 07/2014/TT-BYT", pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    // --- Personal Information ---
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
    doc.text(`Ngày làm bài: ${new Date(result.created_at).toLocaleString('vi-VN')}`, margin, y);
    y += lineHeight * 1.5;
    doc.setFontSize(16);
    doc.text(`Điểm số: ${result.score.toFixed(1)}/10`, margin, y);
    y += lineHeight * 2;

    // --- Questions and Answers ---
    doc.setFontSize(14);
    doc.text("Câu hỏi và đáp án", margin, y);
    y += lineHeight * 1.5;

    quizQuestions.forEach((q, index) => {
      const userAnswer = result.answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;

      // Check for new page before drawing question
      // Estimate space needed for a question block (question + options + answers)
      const estimatedQuestionHeight = (doc.splitTextToSize(`Câu ${index + 1}: ${q.question}`, pageWidth - (margin * 2)).length * lineHeight) +
                                      (Object.keys(q.options).length * lineHeight * 1.5) + // Options
                                      (lineHeight * 3); // User/Correct answers + spacing

      if (y + estimatedQuestionHeight > pageHeight - margin) {
        doc.addPage();
        y = margin; // Reset y for new page
        doc.setFontSize(14);
        doc.text("Câu hỏi và đáp án (tiếp theo)", margin, y);
        y += lineHeight * 1.5;
      }

      doc.setFontSize(12);
      const questionText = `Câu ${index + 1}: ${q.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, pageWidth - (margin * 2));
      doc.text(splitQuestion, margin, y);
      y += (splitQuestion.length * lineHeight);

      Object.entries(q.options).forEach(([key, value]) => {
        const optionText = `${key}. ${value}`;
        const splitOption = doc.splitTextToSize(optionText, pageWidth - (margin * 2) - 10); // Indent options
        doc.text(splitOption, margin + 5, y);
        y += (splitOption.length * lineHeight);
      });

      y += lineHeight * 0.5;
      doc.text(`Bạn đã chọn: ${userAnswer || "Không trả lời"}`, margin, y);
      y += lineHeight;
      doc.text(`Đáp án đúng: ${q.correctAnswer}`, margin, y);
      y += lineHeight * 1.5; // Space after each question
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