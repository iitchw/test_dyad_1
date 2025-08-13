import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { quizQuestions } from "@/lib/quizData";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { CheckCircle2, XCircle, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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

interface Props {
  result: QuizResult;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (resultId: string, newStatus: 'approved' | 'redo_required') => void;
}

export const QuizResultDetail = ({ result, isOpen, onClose, onStatusUpdate }: Props) => {
  const handleStatusUpdate = async (newStatus: 'approved' | 'redo_required') => {
    const loadingToast = showLoading("Đang cập nhật trạng thái...");
    try {
      const { error } = await supabase
        .from("quiz_results")
        .update({ status: newStatus })
        .eq("id", result.id);

      dismissToast(loadingToast);
      if (error) throw error;

      showSuccess("Cập nhật trạng thái thành công!");
      onStatusUpdate(result.id, newStatus);
      onClose();
    } catch (error) {
      dismissToast(loadingToast);
      showError("Cập nhật trạng thái thất bại.");
      console.error("Error updating status:", error);
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById('quiz-result-printable-area');
    if (!printArea) {
      showError("Không thể tìm thấy nội dung để in.");
      return;
    }

    const loadingToast = showLoading("Đang tạo file PDF...");

    html2canvas(printArea, {
      scale: 2, // Higher resolution for better quality
      useCORS: true,
      backgroundColor: '#ffffff', // Explicitly set background to white
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const pdfImageHeight = (pdfWidth - 20) / ratio; // A4 width is 210mm, with 10mm margin each side

      let heightLeft = pdfImageHeight;
      let position = 10; // Top margin

      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, pdfImageHeight);
      heightLeft -= (pdf.internal.pageSize.getHeight() - 20);

      while (heightLeft > 0) {
        position = -heightLeft - 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, pdfImageHeight);
        heightLeft -= (pdf.internal.pageSize.getHeight() - 20);
      }
      
      dismissToast(loadingToast);
      pdf.save(`KetQuaKiemTra_${result.full_name.replace(/ /g, '_')}.pdf`);
      showSuccess("Đã tạo file PDF thành công!");
    }).catch(err => {
      dismissToast(loadingToast);
      showError("Đã xảy ra lỗi khi tạo PDF.");
      console.error("html2canvas error:", err);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết bài kiểm tra của: {result.full_name}</DialogTitle>
          <DialogDescription>
            Xem lại câu trả lời và kết quả chi tiết dưới đây.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] border rounded-md">
          <div id="quiz-result-printable-area" className="p-6 bg-white">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-black">KẾT QUẢ BÀI KIỂM TRA</h2>
                <p className="text-gray-600">Thông tư 07/2014/TT-BYT</p>
            </div>
            <div className="mb-8 space-y-2 text-black">
                <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
                <p><strong>Họ và tên:</strong> {result.full_name}</p>
                <p><strong>Ngày sinh:</strong> {new Date(result.date_of_birth).toLocaleDateString('vi-VN')}</p>
                <p><strong>Giới tính:</strong> {result.gender}</p>
                <p><strong>Ngày làm bài:</strong> {new Date(result.created_at).toLocaleString('vi-VN')}</p>
                <p className="text-xl font-bold"><strong>Điểm số:</strong> {result.score.toFixed(1)}/10</p>
            </div>
            
            <div className="space-y-6 text-black">
              <h3 className="text-lg font-semibold">Câu hỏi và đáp án</h3>
              {quizQuestions.map((q, index) => {
                const userAnswer = result.answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                  <div key={q.id} className="p-4 border rounded-lg break-inside-avoid">
                    <p className="font-semibold mb-2">{`Câu ${index + 1}: ${q.question}`}</p>
                    <div className="space-y-2">
                      {Object.entries(q.options).map(([key, value]) => (
                        <div key={key} className={`flex items-center space-x-3 p-2 rounded-md ${userAnswer === key ? (isCorrect ? 'bg-green-100' : 'bg-red-100') : ''}`}>
                          {userAnswer === key ? (
                            isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <div className="h-5 w-5" />
                          )}
                          <span className={`${key === q.correctAnswer ? 'font-bold text-green-700' : ''}`}>{`${key}. ${value}`}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm">
                      <p>Bạn đã chọn: <span className="font-bold">{userAnswer || "Không trả lời"}</span></p>
                      <p>Đáp án đúng: <span className="font-bold text-green-700">{q.correctAnswer}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            In ra PDF
          </Button>
          <Button variant="outline" onClick={() => handleStatusUpdate('redo_required')}>Yêu cầu làm lại</Button>
          <Button onClick={() => handleStatusUpdate('approved')}>Phê duyệt kết quả</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};