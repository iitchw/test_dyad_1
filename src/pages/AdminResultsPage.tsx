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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Eye, Trash2 } from "lucide-react";

interface QuizResult {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  gender: string;
  workplace: string;
  answers: { [key: string]: string };
  score: number;
  status: string;
  created_at: string;
  session_id: string;
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
      // Automatically select the first session if available
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
        setSelectedSessionId(data[0].id); // Select the most recent session by default
      }
    } catch (err: any) {
      setError("Không thể tải danh sách đợt kiểm tra: " + err.message);
      showError("Không thể tải danh sách đợt kiểm tra.");
      console.error("Error fetching sessions:", err);
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
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(data);
    } catch (err: any) {
      setError("Không thể tải kết quả: " + err.message);
      showError("Không thể tải kết quả.");
      console.error("Error fetching results:", err);
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
      console.error(error);
    } else {
      showSuccess("Xóa kết quả thành công.");
      setResults(results.filter(r => r.id !== deletingResultId));
      setIsDeleteDialogOpen(false);
      setDeletingResultId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý kết quả kiểm tra</CardTitle>
            <CardDescription>Xem và quản lý kết quả các bài kiểm tra đã hoàn thành.</CardDescription>
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
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Giới tính</TableHead>
                    <TableHead>Nơi công tác</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center">Đang tải...</TableCell></TableRow>
                  ) : results.length > 0 ? (
                    results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.full_name}</TableCell>
                        <TableCell>{format(new Date(result.date_of_birth), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{result.phone_number}</TableCell>
                        <TableCell>{result.gender}</TableCell>
                        <TableCell>{result.workplace}</TableCell>
                        <TableCell>{result.score !== null ? result.score : "N/A"}</TableCell>
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
                      <TableCell colSpan={9} className="text-center">Không có kết quả nào cho đợt kiểm tra này.</TableCell>
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

        {/* View Result Dialog */}
        {viewingResult && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Chi tiết kết quả</DialogTitle>
                <DialogDescription>Thông tin chi tiết về bài kiểm tra của {viewingResult.full_name}.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Họ và tên:</Label>
                  <span className="col-span-3">{viewingResult.full_name}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Ngày sinh:</Label>
                  <span className="col-span-3">{format(new Date(viewingResult.date_of_birth), "dd/MM/yyyy")}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Số điện thoại:</Label>
                  <span className="col-span-3">{viewingResult.phone_number}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Giới tính:</Label>
                  <span className="col-span-3">{viewingResult.gender}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Nơi công tác:</Label>
                  <span className="col-span-3">{viewingResult.workplace}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Điểm:</Label>
                  <span className="col-span-3 font-bold text-lg">{viewingResult.score !== null ? viewingResult.score : "N/A"}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Trạng thái:</Label>
                  <span className="col-span-3">{viewingResult.status}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Thời gian nộp:</Label>
                  <span className="col-span-3">{format(new Date(viewingResult.created_at), "dd/MM/yyyy HH:mm")}</span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Câu trả lời:</Label>
                  <div className="col-span-3 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    {Object.entries(viewingResult.answers).map(([questionId, answer]) => (
                      <p key={questionId} className="text-sm mb-1">
                        <strong>Câu {questionId}:</strong> {answer}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsViewDialogOpen(false)}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
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