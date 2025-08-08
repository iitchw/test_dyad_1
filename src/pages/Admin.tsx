import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface QuizResult {
  id: string;
  created_at: string;
  full_name: string;
  score: number;
}

const AdminPage = () => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
    if (isLoggedIn !== "true") {
      navigate("/"); // Chuyển hướng về trang chủ nếu chưa đăng nhập
    }
  }, [navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("quiz_results")
          .select("id, created_at, full_name, score")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }
        setResults(data || []);
      } catch (err: any) {
        console.error("Error fetching quiz results:", err);
        setError("Không thể tải kết quả. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    // Chỉ fetch dữ liệu nếu đã đăng nhập
    if (sessionStorage.getItem("isAdminLoggedIn") === "true") {
        fetchResults();
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminLoggedIn");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quản lý bài kiểm tra</CardTitle>
              <CardDescription>Danh sách tất cả các bài kiểm tra đã được hoàn thành.</CardDescription>
            </div>
            <Button onClick={handleLogout} variant="outline">Đăng xuất</Button>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Ngày làm bài</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : results.length > 0 ? (
                    results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.full_name}</TableCell>
                        <TableCell>{new Date(result.created_at).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell className="text-right">{result.score.toFixed(1)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
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
      <div className="mt-auto pt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default AdminPage;