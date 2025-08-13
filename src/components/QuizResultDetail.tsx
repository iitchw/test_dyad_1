import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { quizQuestions } from "@/lib/quizData";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { CheckCircle2, XCircle, Printer } from "lucide-react";
import { generateQuizPdf } from "@/utils/pdfGenerator"; // Import the new utility

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
    generateQuizPdf(result); // Call the new PDF generation utility
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl"> {/* Removed id="printable-quiz-result" */}
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
        <DialogFooter className="pt-4"> {/* Removed no-print */}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            In kết quả
          </Button>
          <Button variant="outline" onClick={() => handleStatusUpdate('redo_required')}>Yêu cầu làm lại</Button>
          <Button onClick={() => handleStatusUpdate('approved')}>Phê duyệt kết quả</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};