import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface QuizResultProps {
  score: number;
  fullName: string;
  onReset: () => void;
}

export const QuizResult = ({ score, fullName, onReset }: QuizResultProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-3xl text-center">Kết quả bài kiểm tra</CardTitle>
        <CardDescription className="text-center">Cảm ơn bạn đã tham gia!</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-lg mb-4">Họ và tên: {fullName}</p>
        <p className="text-5xl font-bold mb-6">Điểm của bạn: {score.toFixed(1)} / 10</p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button onClick={onReset}>Làm lại bài kiểm tra</Button>
      </CardFooter>
    </Card>
    <MadeWithDyad />
  </div>
);