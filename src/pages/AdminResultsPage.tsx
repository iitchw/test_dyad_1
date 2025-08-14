import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import QuizResultDetail from "@/components/QuizResultDetail";
import * as XLSX from 'xlsx';
import { Download } from "lucide-react";

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
  session_id: string;
  quiz_sessions: { name: string } | null;
}

interface Question {
  id: string;
  session_id: string;
  question_text: string;
  options: { [key: string]: string };
  correct_answer: string;
}

const AdminResultsPage = () => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
    if (isLoggedIn !== "true") {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      if (sessionStorage.getItem("isAdminLoggedIn") !== "true") return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("quiz_results")
          .select("*, quiz_sessions(name)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setResults(data || []);

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("id, session_id, question_text, options, correct_answer");
        
        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Không thể tải kết quả. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleStatusUpdate = (resultId: string, newStatus: 'approved' | 'redo_required') => {
    setResults(prevResults =>
      prevResults.map(r => (r.id === resultId ? { ...r, status: newStatus } : r))
    );
  };

  const getStatusBadge = (status: QuizResult['status']) => {
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

  const handleExport = () => {
    const statusMapping = {
      pending: 'Chờ xem xét',
      approved: 'Đã duyệt',
      redo_required: 'Yêu cầu làm lại'
    };

    const dataToExport = results.map(result => {
      const sessionQuestions = questions.filter(q => q.session_id === result.session_id);
      const answersData: { [key: string]: string } = {};
      
      sessionQuestions.forEach((q, index) => {
        const userAnswer = result.answers[q.id] || 'N/A';
        const isCorrect = userAnswer === q.correct_answer;
        answersData[`Câu ${index + 1}`] = userAnswer;
        answersData[`Câu ${index + 1} (Kết quả)`] = isCorrect ? 'Đúng' : 'Sai';
      });

      return {
        'Đợt kiểm tra': result.quiz_sessions?.name || 'Không rõ',
        'Họ và tên': result.full_name,
        'Ngày sinh': new Date(result.date_of_birth).toLocaleDateString('vi-VN'),
        'Giới tính': result.gender,
        'Số điện thoại': result.phone_number,
        'Điểm': result.score,
        'Trạng thái': statusMapping[result.status],
        'Ngày làm bài': new Date(result.created_at).toLocaleString('vi-VN'),
        ...answersData
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả kiểm tra');
    XLSX.writeFile(workbook, 'KetQuaKiemTra.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Kết quả các bài kiểm tra</CardTitle>
              <CardDescription>Danh sách tất cả các bài kiểm tra đã được hoàn thành.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleExport} variant="outline" disabled={results.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Xuất ra Excel
              </Button>
              <Button onClick={() => navigate('/admin')} variant="outline">Về trang quản trị</Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Đợt kiểm tra</TableHead>
                    <TableHead>Ngày làm bài</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : results.length > 0 ? (
                    results.map((result) => (
                      <TableRow key={result.id} onClick={() => setSelectedResult(result)} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{result.full_name}</TableCell>
                        <TableCell>{result.quiz_sessions?.name || 'N/A'}</TableCell>
                        <TableCell>{new Date(result.created_at).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell>{getStatusBadge(result.status)}</TableCell>
                        <TableCell className="text-right">{result.score.toFixed(1)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Chưa có kết quả nào được nộp.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {selectedResult && (
        <QuizResultDetail
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          result={selectedResult}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
      <div className="mt-auto pt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default AdminResultsPage;