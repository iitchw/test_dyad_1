import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { format } from "date-fns";

import { QuizLoadingSkeleton } from "@/components/quiz/QuizLoadingSkeleton";
import { ErrorDisplay } from "@/components/quiz/ErrorDisplay";
import { QuizResult } from "@/components/quiz/QuizResult";
import { UserInfoForm } from "@/components/quiz/UserInfoForm";
import { QuestionList } from "@/components/quiz/QuestionList";
import { UserInfo, QuizSession } from "@/components/quiz/types";
import { INITIAL_USER_INFO } from "@/components/quiz/constants";

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const QuizPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState<QuizSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo>(INITIAL_USER_INFO);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [score, setScore] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isSupabaseConnected = !!supabase;

    const fetchQuizData = useCallback(async () => {
      if (!sessionId) {
        setError("Không tìm thấy đợt kiểm tra.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [sessionResult, questionsResult] = await Promise.all([
          supabase.from("quiz_sessions").select("id, name").eq("id", sessionId).single(),
          supabase.from("questions").select("id, question_text, options, correct_answer").eq("session_id", sessionId)
        ]);

        if (sessionResult.error || !sessionResult.data) throw new Error("Không thể tải thông tin đợt kiểm tra.");
        if (questionsResult.error) throw new Error("Không thể tải câu hỏi.");

        const shuffledQuestions = shuffleArray(questionsResult.data || []).map(question => {
          const optionsEntries = Object.entries(question.options as { [key: string]: string });
          const shuffledOptionsEntries = shuffleArray(optionsEntries);
          const transformedOptions = shuffledOptionsEntries.map(([key, value]) => ({ key, value }));
          return { ...question, options: transformedOptions };
        });

        setSession({ ...sessionResult.data, questions: shuffledQuestions });
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, [sessionId]);

    useEffect(() => {
      fetchQuizData();
    }, [fetchQuizData]);

    const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
        setUserInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const resetQuiz = useCallback(() => {
        setUserInfo(INITIAL_USER_INFO);
        setAnswers({});
        setScore(null);
        setIsSubmitting(false);
        fetchQuizData();
    }, [fetchQuizData]);

    const validateForm = () => {
      if (!userInfo.fullName || !userInfo.dobDay || !userInfo.dobMonth || !userInfo.dobYear || !userInfo.phone || !userInfo.gender || !userInfo.workplace) {
          showError("Vui lòng điền đầy đủ thông tin cá nhân.");
          return false;
      }
      if (session && Object.keys(answers).length !== session.questions.length) {
          showError("Vui lòng trả lời tất cả các câu hỏi.");
          return false;
      }
      return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || session.questions.length === 0 || !validateForm()) {
          return;
        }

        setIsSubmitting(true);

        let calculatedScore = 0;
        session.questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                calculatedScore++;
            }
        });
        const finalScore = (calculatedScore / session.questions.length) * 10;
        setScore(finalScore);

        if (!isSupabaseConnected) {
            showError("Lỗi cấu hình: Không thể lưu kết quả vào hệ thống.");
            setIsSubmitting(false);
            return;
        }

        const loadingToast = showLoading("Đang lưu kết quả...");
        
        const dateOfBirth = new Date(parseInt(userInfo.dobYear), parseInt(userInfo.dobMonth) - 1, parseInt(userInfo.dobDay));
        
        const submissionData = {
            full_name: userInfo.fullName,
            date_of_birth: format(dateOfBirth, "yyyy-MM-dd"),
            phone_number: userInfo.phone,
            gender: userInfo.gender,
            workplace: userInfo.workplace,
            answers: answers,
            score: finalScore,
            session_id: sessionId,
        };

        try {
            const { error } = await supabase.from("quiz_results").insert([submissionData]);
            dismissToast(loadingToast);
            if (error) throw error;
            showSuccess("Nộp bài thành công! Kết quả của bạn đã được lưu.");
        } catch (error: any) {
            dismissToast(loadingToast);
            showError(`Lưu kết quả thất bại. Điểm của bạn là ${finalScore.toFixed(1)} nhưng không thể lưu vào hệ thống.`);
            console.error("Error saving to Supabase:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <QuizLoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={fetchQuizData} />;
    if (score !== null) return <QuizResult score={score} fullName={userInfo.fullName} onReset={resetQuiz} />;
    if (!session) return <ErrorDisplay error="Không thể tải đợt kiểm tra." />;

    if (session.questions.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold">Đợt kiểm tra này chưa có câu hỏi</h2>
          <p className="text-gray-600 mt-2">Vui lòng quay lại sau.</p>
          <Button onClick={() => navigate('/sessions')} className="mt-4">Quay lại</Button>
        </div>
      );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{session.name}</CardTitle>
                            <CardDescription>Vui lòng điền thông tin và trả lời các câu hỏi dưới đây.</CardDescription>
                        </div>
                        <Badge className={isSupabaseConnected ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                            {isSupabaseConnected ? "Đã kết nối CSDL" : "Chưa kết nối CSDL"}
                        </Badge>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-8 py-6">
                        <UserInfoForm userInfo={userInfo} onUserInfoChange={handleUserInfoChange} />
                        <QuestionList questions={session.questions} answers={answers} onAnswerChange={handleAnswerChange} />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                            {isSubmitting ? "Đang xử lý..." : "Nộp bài và xem kết quả"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <MadeWithDyad />
        </div>
    );
};

export default QuizPage;