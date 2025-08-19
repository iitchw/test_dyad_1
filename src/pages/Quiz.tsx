import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type Option = {
  text: string;
};

type Question = {
  id: string;
  question_text: string;
  options: Option[];
  correct_answer: string;
};

type Session = {
  id: string;
  name: string;
  questions: Question[];
};

type Answers = {
  [questionId: string]: string;
};

const Quiz = () => {
  const { sessionId, resultId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError("Không có ID phiên được cung cấp.");
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select(
          `
          id,
          name,
          questions (
            id,
            question_text,
            options,
            correct_answer
          )
        `
        )
        .eq("id", sessionId)
        .single();

      if (error) {
        setError("Không thể tải phiên trắc nghiệm. Vui lòng thử lại.");
        console.error(error);
      } else if (data) {
        setSession(data as Session);
      } else {
        setError("Không tìm thấy phiên trắc nghiệm.");
      }
      setLoading(false);
    };

    fetchSession();
  }, [sessionId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!session || !resultId) return;

    let score = 0;
    session.questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        score++;
      }
    });

    const finalScore = (score / session.questions.length) * 100;

    const { error } = await supabase
      .from("quiz_results")
      .update({
        answers: answers,
        score: finalScore,
        status: "completed",
      })
      .eq("id", resultId);

    if (error) {
      setError("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
      console.error(error);
    } else {
      navigate(`/results/${resultId}`);
    }
  };

  const handleNext = () => {
    if (session && currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải câu hỏi...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!session) {
    return <div className="flex justify-center items-center h-screen">Không tìm thấy phiên trắc nghiệm.</div>;
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{session.name}</CardTitle>
          <div className="pt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Câu {currentQuestionIndex + 1} trên {session.questions.length}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center">{currentQuestion.question_text}</h3>
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                  <RadioGroupItem value={option.text} id={`option-${currentQuestion.id}-${optionIndex}`} />
                  <Label htmlFor={`option-${currentQuestion.id}-${optionIndex}`} className="flex-1 cursor-pointer text-base">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-6">
          <Button onClick={handlePrev} disabled={currentQuestionIndex === 0} variant="outline">
            Câu trước
          </Button>
          {currentQuestionIndex === session.questions.length - 1 ? (
            <Button onClick={handleSubmit} size="lg">Nộp bài</Button>
          ) : (
            <Button onClick={handleNext} size="lg">Câu tiếp theo</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Quiz;