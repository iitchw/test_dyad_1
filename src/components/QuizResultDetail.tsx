import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { generatePdfFromQuizResult } from "@/lib/pdfGenerator";
import { useEffect, useState } from "react";

interface Question {
  id: string;
  question_text: string;
  options: { [key: string]: string };
  correct_answer: string;
}

interface Result {
  id: string;
  created_at: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  gender: string;
  score: number;
  status: 'pending' | 'approved' | 'redo_required';
  answers: { [key: string]: string };
  session_id: string;
  quiz_sessions: { name: string } | null;
}

interface QuizResultDetailProps {
  isOpen: boolean;
  onClose: () => void;
  result: Result | null;
  onStatusUpdate: (resultId: string, newStatus: 'approved' | 'redo_required') => void;
}

const QuizResultDetail = ({ isOpen, onClose, result, onStatusUpdate }: QuizResultDetailProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    if (result?.session_id) {
      const fetchQuestions = async () => {
        setLoadingQuestions(true);
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("session_id", result.session_id);
        
        if (error) {
          console.error("Error fetching questions for detail view:", error);
          showError("Không thể tải chi tiết câu hỏi.");
        } else {
          setQuestions(data || []);
        }
        setLoadingQuestions(false);
      };
      fetchQuestions();
    }
  }, [result]);

  if (!result) return null;

  const handleStatusChange = async (newStatus: 'approved' | 'redo_required') => {
    const { error } = await supabase
      .from("quiz_results")
      .update({ status: newStatus })
      .eq("id", result.id);

    if (error) {
      showError("Cập nhật trạng thái thất bại.");
    } else {
      showSuccess("Cập nhật trạng thái thành công.");
      onStatusUpdate(result.id, newStatus);
      onClose();
    }
  };

  const handleDownloadPdf = () => {
    const resultWithQuestions = {
      ...result,
      questions: questions,
    };
    generatePdfFromQuizResult(resultWithQuestions, `KetQua_${result.full_name.replace(/\s/g, '_')}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Đã duyệt</Badge>;
      case 'redo_required':
        return <Badge variant="destructive">Yêu cầu làm lại</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Chờ xem xét</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chi tiết kết quả - {result.full_name}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">KẾT QUẢ BÀI KIỂM TRA</h2>
            {result.quiz_sessions?.name && (
              <p className="text-lg text-gray-600 mt-1">
                Đợt kiểm tra: <span className="font-semibold">{result.quiz_sessions.name}</span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Thông tin cá nhân</h3>
              <p><strong>Họ và tên:</strong> {result.full_name}</p>
              <p><strong>Ngày sinh:</strong> {new Date(result.date_of_birth).toLocaleDateString('vi-VN')}</p>
              <p><strong>Giới tính:</strong> {result.gender}</p>
              <p><strong>Số điện thoại:</strong> {result.phone_number}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Kết quả</h3>
              <p><strong>Điểm số:</strong> {result.score.toFixed(1)}/10</p>
              <p><strong>Trạng thái:</strong> {getStatusBadge(result.status)}</p>
              <p><strong>Ngày làm bài:</strong> {new Date(result.created_at).toLocaleString('vi-VN')}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Chi tiết câu trả lời</h3>
            {loadingQuestions ? <p>Đang tải câu hỏi...</p> : (
              <div className="space-y-4">
                {questions.map((q, index) => {
                  const userAnswerKey = result.answers[q.id];
                  const isCorrect = userAnswerKey === q.correct_answer;
                  return (
                    <div key={q.id} className={`p-3 border rounded-md ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <p className="font-medium">Câu {index + 1}: {q.question_text}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {Object.entries(q.options).map(([key, value]: [string, any]) => (
                          <p key={key} className={`${
                            key === userAnswerKey ? (isCorrect ? 'text-green-700 font-bold' : 'text-red-700 font-bold') : 
                            (key === q.correct_answer ? 'text-blue-700' : 'text-gray-600')
                          }`}>
                            {key}. {value}
                          </p>
                        ))}
                      </div>
                      <p className={`text-sm mt-2 font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        Bạn đã chọn: {userAnswerKey || "Không trả lời"} - {isCorrect ? "Đúng" : "Sai"}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={handleDownloadPdf}>Tải PDF</Button>
          <div className="flex-grow" />
          <Button variant="secondary" onClick={() => handleStatusChange('redo_required')}>Yêu cầu làm lại</Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('approved')}>Phê duyệt</Button>
          <DialogClose asChild>
            <Button variant="outline">Đóng</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizResultDetail;