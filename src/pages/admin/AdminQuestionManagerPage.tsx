import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { PlusCircle, Upload } from "lucide-react";
import * as XLSX from 'xlsx';

// Types
interface Question {
  id: string;
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={2} className="text-center">Đang tải...</TableCell></TableRow>
                  ) : questions.length > 0 ? (
                    questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium whitespace-pre-wrap">{q.question_text}</TableCell>
                        <TableCell>{q.correct_answer}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">Chưa có câu hỏi nào.</TableCell>
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
      </div>
    </div>
  );
};

export default AdminQuestionManagerPage;