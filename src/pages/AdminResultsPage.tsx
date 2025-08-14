import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Eye, Trash2, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import QuizResultDetail from "@/components/QuizResultDetail";

interface QuizResult {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  gender: string;
  workplace: string;
  answers: { [key: string]: string };
  score: number;
  status: 'pending' | 'approved' | 'redo_required';
  created_at: string;
  session_id: string;
  quiz_sessions: { name: string } | null;
}

interface QuizSession {
  id: string;
  name: string;
}

const AdminResultsPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingResult, setViewingResult] = useState<QuizResult | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingResultId, setDeletingResultId] = useState<string | null>(null);

  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
      navigate("/");
      return;
    }
    fetchSessions();
  }, [navigate]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchResults(selectedSessionId);
    } else if (quizSessions.length > 0) {
      setSelectedSessionId(quizSessions[0].id);
    }
  }, [selectedSessionId, quizSessions]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizSessions(data);
      if (data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    } catch (err: any) {
      setError("Không thể tải danh sách đợt kiểm tra: " + err.message);
      showError("Không thể tải danh sách đợt kiểm tra.");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*, quiz_sessions(name)")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(data as QuizResult[]);
    } catch (err: any) {
      setError("Không thể tải kết quả: " + err.message);
      showError("Không thể tải kết quả.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (result: QuizResult) => {
    setViewingResult(result);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (resultId: string) => {
    setDeletingResultId(resultId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteResult = async () => {
    if (!deletingResultId) return;
    const loadingToast = showLoading("Đang xóa kết quả...");
    const { error } = await supabase
      .from("quiz_results")
      .delete()
      .eq("id", deletingResultId);
    dismissToast(loadingToast);
    if (error) {
      showError("Xóa kết quả thất bại.");
    } else {
      showSuccess("Xóa kết quả thành công.");
      setResults(results.filter(r => r.id !== deletingResultId));
      setIsDeleteDialogOpen(false);
      setDeletingResultId(null);
    }
  };

  const handleExportXLSX = async () => {
    if (results.length === 0) {
      showError("Không có dữ liệu để xuất.");
      return;
    }

    const loadingToast = showLoading("Đang chuẩn bị dữ liệu để xuất...");

    try {
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, question_text, options")
        .eq("session_id", selectedSessionId!)
        .order("created_at", { ascending: true });

      if (questionsError) throw questionsError;

      const dataToExport = results.map(r => {
        const baseData: { [key: string]: any } = {
          "Họ và tên": r.full_name,
          "Ngày sinh": format(new Date(r.date_of_birth), "dd/MM/yyyy"),
          "Số điện thoại": r.phone_number,
          "Giới tính": r.gender,
          "Nơi công tác": r.workplace,
          "Điểm": r.score,
          "Trạng thái": r.status,
          "Thời gian nộp": format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
        };

        questions.forEach((q, index) => {
          const userAnswerKey = r.answers[q.id];
          const userAnswerText = userAnswerKey ? `${userAnswerKey}. ${q.options[userAnswerKey]}` : "Không trả lời";
          baseData[`Câu ${index + 1}`] = q.question_text;
          baseData[`Trả lời câu ${index + 1}`] = userAnswerText;
        });

        return baseData;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Kết quả");
      const sessionName = quizSessions.find(s => s.id === selectedSessionId)?.name || "session";
      XLSX.writeFile(workbook, `KetQua_${sessionName.replace(/\s/g, '_')}.xlsx`);
      
      dismissToast(loadingToast);
      showSuccess("Xuất file Excel thành công!");

    } catch (error) {
      dismissToast(loadingToast);
      showError("Đã xảy ra lỗi khi xuất file Excel.");
      console.error("Export error:", error);
    }
  };

  const handleStatusUpdate = (resultId: string, newStatus: 'approved' | 'redo_required') => {
    setResults(prevResults =>
      prevResults.map(r => (r.id === resultId ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Quản lý kết quả kiểm tra</CardTitle>
                <CardDescription>Xem và quản lý kết quả các bài kiểm tra đã hoàn thành.</CardDescription>
              </div>
              <Button onClick={handleExportXLSX}>
                <Download className="mr-2 h-4 w-4" />
                Xuất ra Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Label htmlFor="session-select" className="whitespace-nowrap">Chọn đợt kiểm tra:</Label>
              <Select
                value={selectedSessionId || ""}
                onValueChange={(value) => setSelectedSessionId(value)}
                disabled={loading || quizSessions.length === 0}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Chọn đợt kiểm tra" />
                </SelectTrigger>
                <SelectContent>
                  {quizSessions.length === 0 ? (
                    <SelectItem value="no-sessions" disabled>Không có đợt kiểm tra nào</SelectItem>
                  ) : (
                    quizSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Ngày sinh</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Đang tải...</TableCell></TableRow>
                  ) : results.length > 0 ? (
                    results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.full_name}</TableCell>
                        <TableCell>{format(new Date(result.date_of_birth), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{result.score !== null ? result.score.toFixed(1) : "N/A"}</TableCell>
                        <TableCell>{result.status}</TableCell>
                        <TableCell>{format(new Date(result.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => handleViewResult(result)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(result.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Không có kết quả nào cho đợt kiểm tra này.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Button variant="link" onClick={() => navigate('/admin')} className="mt-4">
          &larr; Quay lại trang quản trị
        </Button>

        <QuizResultDetail
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          result={viewingResult}
          onStatusUpdate={handleStatusUpdate}
        />

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa kết quả này không? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleDeleteResult}>Xóa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminResultsPage;