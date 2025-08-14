import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { quizQuestions } from "@/lib/quizData";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { CheckCircle2, XCircle, Printer } from "lucide-react";
import { generatePdfFromElement } from "@/lib/pdfGenerator";

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
    // Create a container for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'temp-print-area';
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.width = '800px';
    printContainer.style.padding = '20px';
    printContainer.style.fontFamily = 'sans-serif';
    printContainer.style.color = 'black';
    printContainer.style.backgroundColor = 'white';

    let content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="font-size: 24px; font-weight: bold;">KẾT QUẢ BÀI KIỂM TRA</h2>
        <p style="color: #555;">Thông tư 07/2014/TT-BYT</p>
      </div>
      <div style="margin-bottom: 32px; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Thông tin cá nhân</h3>
        <p><strong>Họ và tên:</strong> ${result.full_name}</p>
        <p><strong>Ngày sinh:</strong> ${new Date(result.date_of_birth).toLocaleDateString('vi-VN')}</p>
        <p><strong>Giới tính:</strong> ${result.gender}</p>
        <p><strong>Ngày làm bài:</strong> ${new Date(result.created_at).toLocaleString('vi-VN')}</p>
        <p style="font-size: 20px; font-weight: bold; margin-top: 8px;"><strong>Điểm số:</strong> ${result.score.toFixed(1)}/10</p>
      </div>
      <div>
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Câu hỏi và đáp án</h3>
    `;

    quizQuestions.forEach((q, index) => {
      const userAnswer = result.answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      
      let optionsHtml = '';
      Object.entries(q.options).forEach(([key, value]) => {
        let optionStyle = 'padding: 4px; border-radius: 4px;';
        if (userAnswer === key) {
            optionStyle += isCorrect ? ' background-color: #e6fffa;' : ' background-color: #ffebee;';
        }
        if (key === q.correctAnswer) {
            optionStyle += ' font-weight: bold; color: #2f855a;';
        }
        optionsHtml += `<div style="${optionStyle}">${key}. ${value}</div>`;
      });

      content += `
        <div style="padding: 16px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 16px; page-break-inside: avoid;">
          <p style="font-weight: 600; margin-bottom: 8px;">Câu ${index + 1}: ${q.question}</p>
          <div style="margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;">${optionsHtml}</div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 8px 0;" />
          <p>Bạn đã chọn: <strong>${userAnswer || "Không trả lời"}</strong> ${isCorrect ? '<span style="color: green; font-weight: bold;">✔ Đúng</span>' : '<span style="color: red; font-weight: bold;">❌ Sai</span>'}</p>
          <p>Đáp án đúng: <strong style="color: #2f855a;">${q.correctAnswer}</strong></p>
        </div>
      `;
    });

    content += `</div>`;
    printContainer.innerHTML = content;

    document.body.appendChild(printContainer);

    generatePdfFromElement(printContainer, `KetQuaKiemTra_${result.full_name.replace(/ /g, '_')}`)
      .finally(() => {
        document.body.removeChild(printContainer);
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
          <div className="p-6 bg-white">
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