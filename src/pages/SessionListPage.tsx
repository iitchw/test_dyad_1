import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { FileText } from "lucide-react";

interface QuizSession {
  id: string;
  name: string;
  created_at: string;
}

const SessionListPage = () => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("quiz_sessions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSessions(data || []);
      } catch (err: any) {
        console.error("Error fetching sessions:", err);
        setError("Không thể tải danh sách đợt kiểm tra.");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Chọn đợt kiểm tra</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Vui lòng chọn một đợt kiểm tra để bắt đầu.</p>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </Card>
          ))
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : sessions.length > 0 ? (
          sessions.map((session) => (
            <Link to={`/quiz/${session.id}`} key={session.id} className="block">
              <Card className="hover:shadow-lg hover:border-primary transition-all duration-300">
                <CardHeader className="flex-row items-center gap-4 p-4">
                  <FileText className="w-8 h-8 text-primary" />
                  <CardTitle>{session.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-gray-500">
                    Tạo ngày: {new Date(session.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-500">Hiện không có đợt kiểm tra nào.</p>
        )}
      </div>
      <div className="mt-auto pt-12">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default SessionListPage;