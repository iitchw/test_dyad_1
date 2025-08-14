import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Question {
    id: string;
    question_text: string;
    options: { [key: string]: string };
    correct_answer: string;
}

const Quiz = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [fullName, setFullName] = useState("");
    const [dob, setDob] = useState("");
    const [phone, setPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sessionName, setSessionName] = useState("");


    useEffect(() => {
        const fetchQuizData = async () => {
            if (!sessionId) return;

            // Fetch session name
            const { data: sessionData, error: sessionError } = await supabase
                .from('quiz_sessions')
                .select('name')
                .eq('id', sessionId)
                .single();

            if (sessionError) {
                console.error("Error fetching session name:", sessionError);
                toast.error("Không thể tải tên phiên kiểm tra.");
                return;
            }
            setSessionName(sessionData.name);


            // Fetch questions
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('session_id', sessionId);

            if (error) {
                console.error("Error fetching questions:", error);
                toast.error("Không thể tải câu hỏi.");
            } else {
                setQuestions(data);
            }
        };

        fetchQuizData();
    }, [sessionId]);

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (Object.keys(answers).length !== questions.length) {
            toast.error("Vui lòng trả lời tất cả các câu hỏi.");
            setSubmitting(false);
            return;
        }

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                score++;
            }
        });

        const finalScore = (score / questions.length) * 10;

        const { error } = await supabase
            .from('quiz_results')
            .insert([{
                full_name: fullName,
                date_of_birth: dob,
                phone_number: phone,
                answers: answers,
                score: finalScore,
                session_id: sessionId,
            }])
            .select()
            .single();

        setSubmitting(false);

        if (error) {
            console.error("Error submitting results:", error);
            toast.error("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
        } else {
            toast.success("Nộp bài thành công!");
            navigate("/sessions");
        }
    };

    if (questions.length === 0) {
        return <div className="flex justify-center items-center h-screen">Đang tải bài kiểm tra...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Bài kiểm tra năng lực</CardTitle>
                    {sessionName && <p className="text-center text-xl text-muted-foreground">{sessionName}</p>}
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-8 py-6 text-lg">
                        <div className="space-y-4 p-6 border rounded-lg">
                            <h3 className="text-xl font-semibold">Thông tin cá nhân</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Họ và tên</Label>
                                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Ngày sinh</Label>
                                    <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        {questions.map((q, index) => (
                            <div key={q.id} className="space-y-4 p-6 border rounded-lg">
                                <p className="font-semibold text-lg">Câu {index + 1}: {q.question_text}</p>
                                <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)} className="space-y-2">
                                    {Object.entries(q.options).map(([key, optionText]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                            <RadioGroupItem value={key} id={`${q.id}-${key}`} />
                                            <Label htmlFor={`${q.id}-${key}`}>{optionText}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        ))}

                        <div className="text-center">
                            <Button type="submit" size="lg" disabled={submitting}>
                                {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
};

export default Quiz;