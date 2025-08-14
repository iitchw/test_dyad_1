import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { ListChecks, FileText } from "lucide-react";

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
    if (isLoggedIn !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminLoggedIn");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Trang quản trị</h1>
          <Button onClick={handleLogout} variant="outline">Đăng xuất</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/admin/sessions">
            <Card className="h-full hover:shadow-lg hover:border-primary transition-all duration-300">
              <CardHeader className="flex-row items-center gap-4 p-4">
                <ListChecks className="w-10 h-10 text-primary" />
                <CardTitle className="text-2xl">Quản lý Đợt kiểm tra</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-gray-600 dark:text-gray-400">
                  Tạo, sửa và quản lý các đợt kiểm tra và bộ câu hỏi.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/results">
            <Card className="h-full hover:shadow-lg hover:border-primary transition-all duration-300">
              <CardHeader className="flex-row items-center gap-4 p-4">
                <FileText className="w-10 h-10 text-primary" />
                <CardTitle className="text-2xl">Xem kết quả</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-gray-600 dark:text-gray-400">
                  Xem lại, phê duyệt và xuất kết quả các bài làm của học viên.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      <div className="mt-auto pt-12">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default AdminDashboardPage;