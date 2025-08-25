import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Question } from "./types";

interface QuestionListProps {
  questions: Question[];
  answers: { [key: string]: string };
  onAnswerChange: (questionId: string, value: string) => void;
}

export const QuestionList = ({ questions, answers, onAnswerChange }: QuestionListProps) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Câu hỏi trắc nghiệm</h3>
    {questions.map((q, index) => (
      <div key={q.id} className="p-4 border rounded-lg">
        <p className="font-medium mb-4">{`Câu ${index + 1}: ${q.question_text}`}</p>
        <RadioGroup value={answers[q.id] || ""} onValueChange={(value) => onAnswerChange(q.id, value)}>
          {q.options.map((option) => (
            <div key={option.key} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={option.key} id={`${q.id}-${option.key}`} />
              <Label htmlFor={`${q.id}-${option.key}`}>{option.value}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    ))}
  </div>
);