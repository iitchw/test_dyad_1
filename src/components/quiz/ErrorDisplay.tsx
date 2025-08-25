import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold text-red-600">Lỗi</h2>
      <p className="text-gray-600 mt-2">{error}</p>
      <div className="flex gap-4 mt-4">
        {onRetry && <Button onClick={onRetry}>Thử lại</Button>}
        <Button onClick={() => navigate('/sessions')} variant="outline">Quay lại</Button>
      </div>
    </div>
  );
};