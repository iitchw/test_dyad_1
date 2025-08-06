import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md text-center">
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
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;