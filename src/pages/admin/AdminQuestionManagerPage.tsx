import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { PlusCircle, Upload, Download, Edit, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';

// Types
interface Question {
  id: string;
  session_id: string;
  question_text: string;
  options: { [key: string]: string };
  correct_answer: string;
}
interface QuizSession {
  id: string;
  name: string;
}

const AdminQuestionManagerPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for new question dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct: "A",
  });

  // State for edit question dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editedQuestionData, setEditedQuestionData] = useState({
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct: "A",
  });

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
      navigate("/");
      return;
    }
    if (!sessionId) {
      navigate("/admin/sessions");
      return;
    }
    fetchData();
  }, [sessionId, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("quiz_sessions")
        .select("id, name")
        .eq("id", sessionId!)
        .single();
      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      if (questionsError) throw questionsError;
      setQuestions(questionsData);
    } catch (error) {
      showError("Không thể tải dữ liệu.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    const { text, optionA, optionB, optionC, optionD, correct } = newQuestion;
    if (!text || !optionA || !optionB || !optionC || !optionD) {
      showError("Vui lòng điền đầy đủ thông tin câu hỏi.");
      return;
    }

    const questionData = {
      session_id: sessionId,
      question_text: text,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correct_answer: correct,
    };

    const loadingToast = showLoading("Đang thêm câu hỏi...");
    const { data, error } = await supabase.from("questions").insert([questionData]).select();
    dismissToast(loadingToast);

    if (error) {
      showError("Thêm câu hỏi thất bại.");
    } else {
      showSuccess("Thêm câu hỏi thành công.");
      setQuestions([...questions, data[0]]);
      setIsAddDialogOpen(false);
      setNewQuestion({ text: "", optionA: "", optionB: "", optionC: "", optionD: "", correct: "A" });
    }
  };

  const handleEditClick = (question: Question) => {
    setEditingQuestion(question);
    setEditedQuestionData({
      text: question.question_text,
      optionA: question.options.A,
      optionB: question.options.B,
      optionC: question.options.C,
      optionD: question.options.D,
      correct: question.correct_answer,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion) return;
    const { text, optionA, optionB, optionC, optionD, correct } = editedQuestionData;
    if (!text || !optionA || !optionB || !optionC || !optionD) {
      showError("Vui lòng điền đầy đủ thông tin câu hỏi.");
      return;
    }

    const updatedData = {
      question_text: text,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correct_answer: correct,
    };

    const loadingToast = showLoading("Đang cập nhật câu hỏi...");
    const { data, error } = await supabase
      .from("questions")
      .update(updatedData)
      .eq("id", editingQuestion.id)
      .select();
    dismissToast(loadingToast);

    if (error) {
      showError("Cập nhật câu hỏi thất bại.");
      console.error(error);
    } else {
      showSuccess("Cập nhật câu hỏi thành công.");
      setQuestions(questions.map(q => (q.id === editingQuestion.id ? data[0] : q)));
      setIsEditDialogOpen(false);
      setEditingQuestion(null);
    }
  };

  const handleDeleteClick = (questionId: string) => {
    setDeletingQuestionId(questionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteQuestion = async () => {
    if (!deletingQuestionId) return;

    const loadingToast = showLoading("Đang xóa câu hỏi...");
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", deletingQuestionId);
    dismissToast(loadingToast);

    if (error) {
      showError("Xóa câu hỏi thất bại.");
      console.error(error);
    } else {
      showSuccess("Xóa câu hỏi thành công.");
      setQuestions(questions.filter(q => q.id !== deletingQuestionId));
      setIsDeleteDialogOpen(false);
      setDeletingQuestionId(null);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      const newQuestions = json.map(row => ({
        session_id: sessionId,
        question_text: row['question_text'],
        options: {
          A: row['option_a'],
          B: row['option_b'],
          C: row['option_c'],
          D: row['option_d'],
        },
        correct_answer: String(row['correct_answer']).toUpperCase(),
      })).filter(q => q.question_text && q.options.A && q.options.B && q.options.C && q.options.D && q.correct_answer);

      if (newQuestions.length === 0) {
        showError("Không tìm thấy câu hỏi hợp lệ trong file.");
        return;
      }

      const loadingToast = showLoading(`Đang nhập ${newQuestions.length} câu hỏi...`);
      const { error } = await supabase.from("questions").insert(newQuestions);
      dismissToast(loadingToast);

      if (error) {
        showError("Nhập câu hỏi thất bại.");
        console.error(error);
      } else {
        showSuccess(`Đã nhập thành công ${newQuestions.length} câu hỏi.`);
        fetchData(); // Refresh data
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        question_text: "Thủ đô của Việt Nam là gì?",
        option_a: "Hà Nội",
        option_b: "Đà Nẵng",
        option_c: "TP. Hồ Chí Minh",
        option_d: "Hải Phòng",
        correct_answer: "A",
      },
      {
        question_text: "1 + 1 bằng mấy?",
        option_a: "1",
        option_b: "2",
        option_c: "3",
        option_d: "4",
        correct_answer: "B",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    
    worksheet['!cols'] = [
      { wch: 50 }, // question_text
      { wch: 20 }, // option_a
      { wch: 20 }, // option_b
      { wch: 20 }, // option_c
      { wch: 20 }, // option_d
      { wch: 15 }, // correct_answer
    ];

    XLSX.writeFile(workbook, "Mau_Cau_Hoi.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quản lý câu hỏi cho: {session?.name || "..."}</CardTitle>
              <CardDescription>Thêm, sửa, xóa và nhập câu hỏi cho đợt kiểm tra này.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Tải file mẫu
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Nhập từ Excel
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .csv" />
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Thêm thủ công</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader><DialogTitle>Thêm câu hỏi mới</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="q-text">Nội dung câu hỏi</Label>
                    <Input id="q-text" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} />
                    <Label htmlFor="q-a">Đáp án A</Label>
                    <Input id="q-a" value={newQuestion.optionA} onChange={e => setNewQuestion({...newQuestion, optionA: e.target.value})} />
                    <Label htmlFor="q-b">Đáp án B</Label>
                    <Input id="q-b" value={newQuestion.optionB} onChange={e => setNewQuestion({...newQuestion, optionB: e.target.value})} />
                    <Label htmlFor="q-c">Đáp án C</Label>
                    <Input id="q-c" value={newQuestion.optionC} onChange={e => setNewQuestion({...newQuestion, optionC: e.target.value})} />
                    <Label htmlFor="q-d">Đáp án D</Label>
                    <Input id="q-d" value={newQuestion.optionD} onChange={e => setNewQuestion({...newQuestion, optionD: e.target.value})} />
                    <Label htmlFor="q-correct">Đáp án đúng</Label>
                    <Select value={newQuestion.correct} onValueChange={val => setNewQuestion({...newQuestion, correct: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleAddQuestion}>Thêm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Câu hỏi</TableHead>
                    <TableHead>Đáp án đúng</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center">Đang tải...</TableCell></TableRow>
                  ) : questions.length > 0 ? (
                    questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium whitespace-pre-wrap">{q.question_text}</TableCell>
                        <TableCell>{q.correct_answer}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditClick(q)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(q.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Chưa có câu hỏi nào.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Button variant="link" onClick={() => navigate('/admin/sessions')} className="mt-4">
          &larr; Quay lại danh sách
        </Button>

        {/* Edit Question Dialog */}
        {editingQuestion && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Chỉnh sửa câu hỏi</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="edit-q-text">Nội dung câu hỏi</Label>
                <Input id="edit-q-text" value={editedQuestionData.text} onChange={e => setEditedQuestionData({...editedQuestionData, text: e.target.value})} />
                <Label htmlFor="edit-q-a">Đáp án A</Label>
                <Input id="edit-q-a" value={editedQuestionData.optionA} onChange={e => setEditedQuestionData({...editedQuestionData, optionA: e.target.value})} />
                <Label htmlFor="edit-q-b">Đáp án B</Label>
                <Input id="edit-q-b" value={editedQuestionData.optionB} onChange={e => setEditedQuestionData({...editedQuestionData, optionB: e.target.value})} />
                <Label htmlFor="edit-q-c">Đáp án C</Label>
                <Input id="edit-q-c" value={editedQuestionData.optionC} onChange={e => setEditedQuestionData({...editedQuestionData, optionC: e.target.value})} />
                <Label htmlFor="edit-q-d">Đáp án D</Label>
                <Input id="edit-q-d" value={editedQuestionData.optionD} onChange={e => setEditedQuestionData({...editedQuestionData, optionD: e.target.value})} />
                <Label htmlFor="edit-q-correct">Đáp án đúng</Label>
                <Select value={editedQuestionData.correct} onValueChange={val => setEditedQuestionData({...editedQuestionData, correct: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleEditQuestion}>Lưu thay đổi</Button>
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
                Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleDeleteQuestion}>Xóa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminQuestionManagerPage;