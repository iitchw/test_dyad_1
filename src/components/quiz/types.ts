export interface UserInfo {
  fullName: string;
  phone: string;
  gender: string;
  workplace: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
}

export interface Question {
  id: string;
  question_text: string;
  options: { key: string; value: string }[];
  correct_answer: string;
}

export interface QuizSession {
  id: string;
  name: string;
  questions: Question[];
}