import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { MadeWithDyad } from "@/components/made-with-dyad";

const quizQuestions = [
  {
    id: 'q1',
    question: 'Theo Thông tư 07/2014/TT-BYT, ứng xử “Có đạo đức, nhân cách và lối sống lành mạnh, trong sáng của người thầy thuốc theo quan điểm cần, kiệm, liêm, chính, chí công vô tư” là ứng xử của công chức, viên chức y tế trong trường hợp nào?',
    options: {
      A: 'Ứng xử của công chức, viên chức y tế khi thi hành công vụ, nhiệm vụ được giao',
      B: 'Ứng xử của công chức, viên chức y tế đối với đồng nghiệp',
      C: 'Ứng xử của công chức, viên chức y tế đối với cơ quan, tổ chức, cá nhân',
      D: 'Ứng xử của công chức, viên chức y tế trong các cơ sở khám bệnh, chữa bệnh',
    },
    correctAnswer: 'A',
  },
  {
    id: 'q2',
    question: 'Theo Thông tư 07/2014/TT-BYT, Ứng xử của công chức, viên chức y tế khi thi hành công vụ, nhiệm vụ được giao, một trong những việc phải làm là:',
    options: {
      A: 'Bảo đảm thông tin trao đổi đúng với nội dung công việc mà cơ quan, tổ chức, công dân cần hướng dẫn, trả lời',
      B: 'Tôn trọng và lắng nghe ý kiến của đồng nghiệp; phối hợp, trao đổi kinh nghiệm, học hỏi lẫn nhau trong thi hành công vụ, nhiệm vụ được giao',
      C: 'Khám bệnh, chỉ định xét nghiệm, kê đơn phù hợp với tình trạng bệnh và khả năng chi trả của người bệnh',
      D: 'Có ý thức tổ chức kỷ luật; thực hiện đúng quy trình chuyên môn, nghiệp vụ, nội quy, quy chế làm việc của ngành, của đơn vị',
    },
    correctAnswer: 'D',
  },
  {
    id: 'q3',
    question: 'Theo Thông tư 07/2014/TT-BYT, Ứng xử của công chức, viên chức y tế khi thi hành công vụ, nhiệm vụ được giao, một trong những việc không được làm là:',
    options: {
      A: 'Phân biệt đối xử về dân tộc, nam nữ, các thành phần xã hội, tín ngưỡng, tôn giáo dưới mọi hình thức',
      B: 'Cố ý kéo dài thời gian khi thi hành công vụ, nhiệm vụ liên quan đến cơ quan, tổ chức, cá nhân',
      C: 'Bè phái, chia rẽ nội bộ, cục bộ địa phương',
      D: 'Tất cả các phương án đều đúng',
    },
    correctAnswer: 'A',
  },
];

const QuizPage = () => {
    const [fullName, setFullName] = useState("");
    const [dob, setDob] = useState("");
    const [phone, setPhone] = useState("");
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [score, setScore] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSupabaseConnected = !!supabase;

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const resetQuiz = () => {
        setFullName("");
        setDob("");
        setPhone("");
        setAnswers({});
        setScore(null);
        setIsSubmitting(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !dob || !phone) {
            showError("Vui lòng điền đầy đủ thông tin cá nhân.");
            return;
        }
        if (Object.keys(answers).length !== quizQuestions.length) {
            showError("Vui lòng trả lời tất cả các câu hỏi.");
            return;
        }

        setIsSubmitting(true);

        let calculatedScore = 0;
        quizQuestions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                calculatedScore++;
            }
        });
        const finalScore = (calculatedScore / quizQuestions.length) * 10;

        if (!isSupabaseConnected) {
            showError("Lỗi cấu hình: Không thể lưu kết quả vào hệ thống.");
            console.error("Supabase client is not initialized. Check environment variables.");
            setScore(finalScore);
            setIsSubmitting(false);
            return;
        }

        const loadingToast = showLoading("Đang nộp bài...");
        
        try {
            const { error } = await supabase.from("quiz_results").insert([
                {
                    full_name: fullName,
                    date_of_birth: dob,
                    phone_number: phone,
                    answers: answers,
                    score: finalScore,
                },
            ]);

            dismissToast(loadingToast);
            
            if (error) {
                throw error;
            }
            
            setScore(finalScore);
            showSuccess("Nộp bài thành công! Kết quả của bạn đã được lưu.");

        } catch (error: any) {
            dismissToast(loadingToast);
            setIsSubmitting(false);
            setScore(finalScore);
            showError(`Lưu kết quả thất bại. Điểm của bạn là ${finalScore.toFixed(1)} nhưng không thể lưu vào hệ thống.`);
            console.error("Error saving to Supabase:", error);
        }
    };

    if (score !== null) {
        return (
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
                    <CardFooter className="flex justify-center">
                        <Button onClick={resetQuiz}>Làm lại bài kiểm tra</Button>
                    </CardFooter>
                </Card>
                <MadeWithDyad />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">Bài kiểm tra kiến thức</CardTitle>
                            <CardDescription>Vui lòng điền thông tin và trả lời các câu hỏi dưới đây.</CardDescription>
                        </div>
                        <Badge className={isSupabaseConnected ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                            {isSupabaseConnected ? "Đã kết nối CSDL" : "Chưa kết nối CSDL"}
                        </Badge>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-8 py-6">
                        <div className="space-y-4 p-6 border rounded-lg">
                            <h3 className="text-xl font-semibold">Thông tin cá nhân</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Họ và tên</Label>
                                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Ngày sinh</Label>
                                    <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" required />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold">Câu hỏi trắc nghiệm</h3>
                            {quizQuestions.map((q, index) => (
                                <div key={q.id} className="p-4 border rounded-lg">
                                    <p className="font-medium mb-4">{`Câu ${index + 1}: ${q.question}`}</p>
                                    <RadioGroup value={answers[q.id]} onValueChange={(value) => handleAnswerChange(q.id, value)}>
                                        {Object.entries(q.options).map(([key, value]) => (
                                            <div key={key} className="flex items-center space-x-2">
                                                <RadioGroupItem value={key} id={`${q.id}-${key}`} />
                                                <Label htmlFor={`${q.id}-${key}`}>{`${key}. ${value}`}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                            {isSubmitting ? "Đang nộp bài..." : "Nộp bài và xem kết quả"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <MadeWithDyad />
        </div>
    );
};

export default QuizPage;