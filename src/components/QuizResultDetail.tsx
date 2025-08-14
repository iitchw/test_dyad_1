import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  question_text: string;
  options: { [key: string]: string };
  correct_answer: string;
}

interface Result {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  gender: string | null;
  score: number | null;
  status: string;
  answers: { [key: string]: string };
  quiz_sessions: {
    name: string;
  } | null;
}

interface QuizResultDetailProps {
  result: Result;
  questions: Question[];
}

const QuizResultDetail = ({ result, questions }: QuizResultDetailProps) => {
  if (!result) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge variant="default" className="bg-green-500">Đạt</Badge>;
      case "failed":
        return <Badge variant="destructive">Không đạt</Badge>;
      default:
        return <Badge variant="secondary">Chưa có</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-black">KẾT QUẢ BÀI KIỂM TRA</h2>
        {result.quiz_sessions?.name && (
          <p className="text-xl text-gray-700 mt-2">
            Đợt kiểm tra: <span className="font-semibold">{result.quiz_sessions.name}</span>
          </p>
        )}
      </div>
      <div className="mb-8 space-y-2 text-black">
        <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
        <p><strong>Họ và tên:</strong> {result.full_name}</p>
        <p><strong>Ngày sinh:</strong> {formatDate(result.date_of_birth)}</p>
        <p><strong>Số điện thoại:</strong> {result.phone_number}</p>
        <p><strong>Giới tính:</strong> {result.gender === 'male' ? 'Nam' : result.gender === 'female' ? 'Nữ' : 'Khác'}</p>
      </div>
      <div className="mb-8 space-y-2 text-black">
        <h3 className="text-lg font-semibold">Kết quả</h3>
        <p><strong>Điểm số:</strong> {result.score !== null ? `${result.score}/${questions.length}` : "Chưa có"}</p>
        <p><strong>Trạng thái:</strong> {getStatusBadge(result.status)}</p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 text-black">Chi tiết câu trả lời</h3>
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswerKey = result.answers?.[question.id];
            const userAnswerText = userAnswerKey ? question.options[userAnswerKey] : "Chưa trả lời";
            const isCorrect = userAnswerKey === question.correct_answer;
            const correctAnswerText = question.options[question.correct_answer];

            return (
              <div key={question.id} className="p-4 border rounded-md bg-gray-50">
                <p className="font-semibold text-black">Câu {index + 1}: {question.question_text}</p>
                <div className="mt-2 space-y-1">
                  <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    <strong>Câu trả lời của bạn:</strong> {userAnswerKey ? `${userAnswerKey}. ${userAnswerText}`: 'Chưa trả lời'}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-blue-600">
                      <strong>Đáp án đúng:</strong> {question.correct_answer}. {correctAnswerText}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResultDetail;