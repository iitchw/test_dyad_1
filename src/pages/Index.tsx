import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizResult {
  id: string;
  created_at: string;
  full_name: string;
  score: number;
}

const Index = () => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("quiz_results")
          .select("id, created_at, full_name, score")
          .order("created_at", { ascending: false })
          .limit(10); // Lấy 10 kết quả gần nhất

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

    fetchResults();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Chào mừng đến với Bài kiểm tra</CardTitle>
            <CardDescription>
              Kiểm tra kiến thức của bạn về Thông tư 07/2014/TT-BYT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Vui lòng nhấn nút bên dưới để bắt đầu bài kiểm tra.
            </p>
            <Link to="/quiz">
              <Button size="lg">Bắt đầu kiểm tra</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo kết quả</CardTitle>
            <CardDescription>Danh sách 10 bài kiểm tra đã được hoàn thành gần đây nhất.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Họ và tên</TableHead>
                    <TableHead>Ngày làm bài</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
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

export default Index;