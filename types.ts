export enum QuestionType {
  MCQ = 'MCQ', // اختيار من متعدد
  TRUE_FALSE = 'TRUE_FALSE', // صواب / خطأ
  MATCHING = 'MATCHING' // مطابقة
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  correctAnswer: string; // 'A', 'B', 'T', 'F', etc.
  optionsCount?: number; // Default 4 for MCQ
}

export interface ExamLayoutConfig {
  columnCount: number;
  questionsPerColumn?: number; // Optional override
  bubbleSize: 'sm' | 'md' | 'lg';
  bubbleSpacing?: 'compact' | 'normal' | 'wide';
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  schoolName: string;
  questions: Question[];
  createdAt: number;
  layoutConfig?: ExamLayoutConfig; // Store layout for consistent scanning
}

export interface StudentResult {
  id: string;
  examId: string;
  studentId: string; // Scanned from bubbles or manual
  studentName?: string;
  answers: Record<number, string>; // Question Num -> Detected Answer
  score: number;
  maxScore: number;
  percentage: number;
  timestamp: number;
  imageUrl?: string; // For review
}

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];