import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { quizQuestions } from "@/lib/quizData";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import { vi } from 'date-fns/locale';

const QuizPage = () => {
    const [fullName, setFullName] = useState("");
    const [dob, setDob] = useState<Date>();
    const [dobInput, setDobInput] = useState("");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [score, setScore] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSupabaseConnected = !!supabase;

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const resetQuiz = () => {
        setFullName("");
        setDob(undefined);
        setDobInput("");
        setPhone("");
        setGender("");
        setAnswers({});
        setScore(null);
        setIsSubmitting(false);
    };

    const handleDobInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDobInput(value);
        const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
            const year = parsedDate.getFullYear();
            if (year > 1900 && year <= new Date().getFullYear()) {
                setDob(parsedDate);
            }
        } else {
            setDob(undefined);
        }
    };

    const handleCalendarSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            setDob(selectedDate);
            setDobInput(format(selectedDate, 'dd/MM/yyyy', { locale: vi }));
            setIsCalendarOpen(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !dob || !phone || !gender) {
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
        
        const submissionData = {
            full_name: fullName,
            date_of_birth: format(dob, "yyyy-MM-dd"),
            phone_number: phone,
            gender: gender,
            answers: answers,
            score: finalScore,
        };

        try {
            const { error } = await supabase.from("quiz_results").insert([submissionData]);

            dismissToast(loadingToast);
            
            if (error) throw error;
            
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
                    <CardFooter className="flex justify-center gap-4">
                        <Button onClick={resetQuiz}>Làm lại bài kiểm tra</Button>
                        <Link to="/">
                            <Button variant="outline">Về trang chủ</Button>
                        </Link>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Họ và tên</Label>
                                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Ngày sinh</Label>
                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                        <div className="relative">
                                            <Input
                                                id="dob"
                                                placeholder="dd/MM/yyyy"
                                                value={dobInput}
                                                onChange={handleDobInputChange}
                                            />
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent">
                                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </PopoverTrigger>
                                        </div>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={dob}
                                                onSelect={handleCalendarSelect}
                                                initialFocus
                                                captionLayout="dropdown-buttons"
                                                fromYear={1950}
                                                toYear={new Date().getFullYear()}
                                                locale={vi}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Giới tính</Label>
                                    <RadioGroup value={gender} onValueChange={setGender} className="flex items-center space-x-4 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Nam" id="gender-male" />
                                            <Label htmlFor="gender-male">Nam</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Nữ" id="gender-female" />
                                            <Label htmlFor="gender-female">Nữ</Label>
                                        </div>
                                    </RadioGroup>
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