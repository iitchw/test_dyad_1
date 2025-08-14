import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { showError } from "@/utils/toast";
import { FileText, Shield } from "lucide-react";

const Index = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    if (username === "admin" && password === "1234512345") {
      sessionStorage.setItem("isAdminLoggedIn", "true");
      setIsLoginDialogOpen(false);
      navigate("/admin");
    } else {
      showError("Tên người dùng hoặc mật khẩu không đúng.");
    }
  };
  
  const handleCardClick = () => {
    setIsLoginDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Hệ thống Kiểm tra Trực tuyến</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Chọn một chức năng để bắt đầu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link to="/sessions" className="block">
          <Card className="h-full hover:shadow-lg hover:border-primary transition-all duration-300">
            <CardHeader className="flex-row items-center gap-4 p-4">
              <FileText className="w-10 h-10 text-primary" />
              <CardTitle className="text-2xl">Làm bài kiểm tra</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-gray-600 dark:text-gray-400">
                Bắt đầu bài kiểm tra bằng cách chọn một đợt kiểm tra có sẵn.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
            <Card onClick={handleCardClick} className="h-full hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer">
              <CardHeader className="flex-row items-center gap-4 p-4">
                <Shield className="w-10 h-10 text-primary" />
                <CardTitle className="text-2xl">Quản lý</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-gray-600 dark:text-gray-400">
                  Truy cập khu vực quản lý. Yêu cầu đăng nhập.
                </p>
              </CardContent>
            </Card>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Đăng nhập Quản trị</DialogTitle>
              <DialogDescription>
                Vui lòng nhập thông tin đăng nhập để truy cập khu vực quản lý.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Tên người dùng
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="col-span-3"
                  placeholder="admin"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  placeholder="••••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAdminLogin}>Đăng nhập</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-auto pt-12">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;