import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { quizQuestions } from "@/lib/quizData";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { CheckCircle2, XCircle, Printer } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleExportToPdf = async () => {
    const loadingToast = showLoading("Đang tạo file PDF...");
    const elementToPrint = document.getElementById('printable-quiz-result');

    if (!elementToPrint) {
        dismissToast(loadingToast);
        showError("Không tìm thấy nội dung để xuất PDF.");
        return;
    }

    const scrollAreaViewport = elementToPrint.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    const footer = elementToPrint.querySelector('.no-print') as HTMLElement;

    // Store original styles to restore them later
    const originalViewportStyle = scrollAreaViewport ? scrollAreaViewport.style.cssText : '';
    const originalFooterDisplay = footer ? footer.style.display : '';

    // Temporarily modify styles for full content capture
    if (footer) footer.style.display = 'none';
    if (scrollAreaViewport) {
        scrollAreaViewport.style.height = 'auto';
        scrollAreaViewport.style.maxHeight = 'none';
        scrollAreaViewport.style.overflow = 'visible';
    }

    try {
        const canvas = await html2canvas(elementToPrint, {
            scale: 2,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = imgHeightInPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfPageHeight;

        while (heightLeft > 0) {
            position -= pdfPageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
            heightLeft -= pdfPageHeight;
        }

        pdf.save(`ket-qua-${result.full_name.replace(/\s/g, '_')}.pdf`);
        
        showSuccess("Xuất PDF thành công!");

    } catch (error) {
        console.error("Lỗi khi xuất PDF:", error);
        showError("Đã xảy ra lỗi khi tạo file PDF.");
    } finally {
        // Restore original styles
        if (footer) footer.style.display = originalFooterDisplay;
        if (scrollAreaViewport) scrollAreaViewport.style.cssText = originalViewportStyle;
        dismissToast(loadingToast);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" id="printable-quiz-result">
        <DialogHeader>
          <DialogTitle>Chi tiết bài kiểm tra của: {result.full_name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
                <span><strong>Ngày làm bài:</strong> {new Date(result.created_at).toLocaleString('vi-VN')}</span>
                <span><strong>Ngày sinh:</strong> {new Date(result.date_of_birth).toLocaleDateString('vi-VN')}</span>
                <span><strong>Giới tính:</strong> {result.gender}</span>
                <span className="font-semibold"><strong>Điểm số:</strong> {result.score.toFixed(1)}/10</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-6">
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
        </ScrollArea>
        <DialogFooter className="pt-4 no-print">
          <Button variant="outline" onClick={handleExportToPdf}>
            <Printer className="mr-2 h-4 w-4" />
            Xuất PDF
          </Button>
          <Button variant="outline" onClick={() => handleStatusUpdate('redo_required')}>Yêu cầu làm lại</Button>
          <Button onClick={() => handleStatusUpdate('approved')}>Phê duyệt kết quả</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};