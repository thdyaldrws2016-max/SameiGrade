import { Exam, StudentResult } from "../types";

const EXAMS_KEY = 'omr_exams';
const RESULTS_KEY = 'omr_results';
const USERS_KEY = 'omr_users';
const CURRENT_USER_KEY = 'omr_current_user';

// --- Exam & Results Storage ---

export const saveExam = (exam: Exam) => {
  const exams = getExams();
  // Check if update or new
  const index = exams.findIndex(e => e.id === exam.id);
  if (index >= 0) {
    exams[index] = exam;
  } else {
    exams.push(exam);
  }
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
};

export const duplicateExam = (examId: string): boolean => {
  const exams = getExams();
  const sourceExam = exams.find(e => e.id === examId);
  
  if (sourceExam) {
    const newExam: Exam = {
      ...sourceExam,
      id: crypto.randomUUID(),
      title: `${sourceExam.title} (نسخة)`,
      createdAt: Date.now(),
      // We keep the layout config and questions identical
    };
    exams.push(newExam); // Add to list
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams)); // Save
    return true;
  }
  return false;
};

export const getExams = (): Exam[] => {
  const data = localStorage.getItem(EXAMS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getExamById = (id: string): Exam | undefined => {
  return getExams().find(e => e.id === id);
};

export const deleteExam = (id: string) => {
  const exams = getExams().filter(e => e.id !== id);
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

export const saveResult = (result: StudentResult) => {
  const results = getResults();
  results.push(result);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
};

export const getResults = (): StudentResult[] => {
  const data = localStorage.getItem(RESULTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getResultsByExamId = (examId: string): StudentResult[] => {
  return getResults().filter(r => r.examId === examId);
};

// --- Auth Storage ---

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // stored plainly for this demo (unsafe for prod)
}

export const registerUser = (user: Omit<User, 'id'>): boolean => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  if (users.find(u => u.username === user.username)) {
    return false; // User exists
  }
  const newUser = { ...user, id: crypto.randomUUID() };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const loginUser = (username: string, password: string): User | null => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const { password, ...safeUser } = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};