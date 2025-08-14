import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { PlusCircle } from "lucide-react";

interface QuizSession {
  id: string;
  name: string;
  created_at: string;
}

const AdminSessionListPage = () => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
      navigate("/");
    }
    fetchSessions();
  }, [navigate]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showError("Không thể tải danh sách đợt kiểm tra.");
      console.error(error);
    } else {
      setSessions(data);
    }
    setLoading(false);
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      showError("Tên đợt kiểm tra không được để trống.");
      return;
    }
    const loadingToast = showLoading("Đang tạo đợt kiểm tra...");
    const { data, error } = await supabase
      .from("quiz_sessions")
      .insert([{ name: newSessionName.trim() }])
      .select();
    
    dismissToast(loadingToast);
    if (error) {
      showError("Tạo đợt kiểm tra thất bại.");
      console.error(error);
    } else {
      showSuccess("Tạo đợt kiểm tra thành công!");
      setSessions([data[0], ...sessions]);
      setNewSessionName("");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quản lý Đợt kiểm tra</CardTitle>
              <CardDescription>Tạo và quản lý các đợt kiểm tra.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tạo Đợt mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo Đợt kiểm tra mới</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="session-name">Tên Đợt kiểm tra</Label>
                  <Input
                    id="session-name"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="Ví dụ: Kiểm tra định kỳ Quý 1"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                  <Button onClick={handleCreateSession}>Tạo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Đợt kiểm tra</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center">Đang tải...</TableCell></TableRow>
                  ) : sessions.length > 0 ? (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.name}</TableCell>
                        <TableCell>{new Date(session.created_at).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell className="text-right">
                          <Link to={`/admin/sessions/${session.id}`}>
                            <Button variant="outline" size="sm">Quản lý câu hỏi</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Chưa có đợt kiểm tra nào.</TableCell>
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
      </div>
    </div>
  );
};

export default AdminSessionListPage;