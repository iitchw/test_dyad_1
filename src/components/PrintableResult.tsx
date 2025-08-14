import React from 'react';
import { quizQuestions } from "@/lib/quizData";

interface QuizResult {
  id: string;
  created_at: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  gender: string;
  score: number;
  status: 'pending' | 'approved' | 'redo_required';
  answers: { [key: string]: string };
}

interface Props {
  result: QuizResult;
}

export const PrintableResult = React.forwardRef<HTMLDivElement, Props>(({ result }, ref) => {
  return (
    <div ref={ref} style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: 'black', backgroundColor: 'white', width: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>KẾT QUẢ BÀI KIỂM TRA</h2>
        <p style={{ color: '#555', fontSize: '16px', margin: '8px 0 0 0' }}>Thông tư 07/2014/TT-BYT</p>
      </div>
      <div style={{ marginBottom: '32px', fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Thông tin cá nhân</h3>
        <p style={{ margin: '4px 0' }}><strong>Họ và tên:</strong> {result.full_name}</p>
        <p style={{ margin: '4px 0' }}><strong>Ngày sinh:</strong> {new Date(result.date_of_birth).toLocaleDateString('vi-VN')}</p>
        <p style={{ margin: '4px 0' }}><strong>Giới tính:</strong> {result.gender}</p>
        <p style={{ margin: '4px 0' }}><strong>Ngày làm bài:</strong> {new Date(result.created_at).toLocaleString('vi-VN')}</p>
        <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '12px 0 0 0' }}><strong>Điểm số:</strong> {result.score.toFixed(1)}/10</p>
      </div>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Câu hỏi và đáp án</h3>
        {quizQuestions.map((q, index) => {
          const userAnswer = result.answers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;
          return (
            <div key={q.id} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '16px', pageBreakInside: 'avoid' }}>
              <p style={{ fontWeight: '600', marginBottom: '8px' }}>Câu {index + 1}: {q.question}</p>
              <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(q.options).map(([key, value]) => (
                  <div key={key} style={{
                    padding: '6px',
                    borderRadius: '4px',
                    backgroundColor: userAnswer === key ? (isCorrect ? '#e6fffa' : '#ffebee') : 'transparent',
                    fontWeight: key === q.correctAnswer ? 'bold' : 'normal',
                    color: key === q.correctAnswer ? '#2f855a' : 'inherit',
                  }}>
                    {key}. {value}
                  </div>
                ))}
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
              <p style={{ margin: '4px 0' }}>Bạn đã chọn: <strong>{userAnswer || "Không trả lời"}</strong> {isCorrect ? <span style={{ color: 'green', fontWeight: 'bold' }}>✔ Đúng</span> : <span style={{ color: 'red', fontWeight: 'bold' }}>❌ Sai</span>}</p>
              <p style={{ margin: '4px 0' }}>Đáp án đúng: <strong style={{ color: '#2f855a' }}>{q.correctAnswer}</strong></p>
            </div>
          );
        })}
      </div>
    </div>
  );
});