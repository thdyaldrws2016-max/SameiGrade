import React, { useState } from 'react';
import { Exam, Question, QuestionType, LETTERS } from '../types';
import { saveExam } from '../utils/storage';

interface ExamFormProps {
  onCancel: () => void;
  onSave: () => void;
}

const ExamForm: React.FC<ExamFormProps> = ({ onCancel, onSave }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  // Settings
  const [columnCount, setColumnCount] = useState<number>(2);

  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = () => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      number: questions.length + 1,
      type: QuestionType.MCQ,
      correctAnswer: 'A',
      optionsCount: 4
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    const filtered = questions.filter(q => q.id !== id);
    // Re-index numbers
    const reindexed = filtered.map((q, idx) => ({ ...q, number: idx + 1 }));
    setQuestions(reindexed);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const updated = { ...q, [field]: value };
        // Reset answer if type changes
        if (field === 'type') {
          if (value === QuestionType.TRUE_FALSE) updated.correctAnswer = 'T';
          else updated.correctAnswer = 'A';
        }
        return updated;
      }
      return q;
    }));
  };

  const handleSave = () => {
    if (!title || questions.length === 0) {
      alert('الرجاء إدخال اسم الاختبار وإضافة سؤال واحد على الأقل');
      return;
    }

    const newExam: Exam = {
      id: crypto.randomUUID(),
      title,
      subject,
      gradeLevel,
      schoolName,
      createdAt: Date.now(),
      questions,
      layoutConfig: {
        columnCount: columnCount,
        bubbleSize: 'md'
      }
    };

    saveExam(newExam);
    onSave();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-gray-800">إنشاء اختبار جديد</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">إلغاء</button>
          <button onClick={handleSave} className="px-6 py-2 bg-primary text-white font-bold rounded hover:bg-emerald-600 shadow">حفظ الاختبار</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar / Settings */}
        <div className="w-full md:w-1/3 bg-gray-50 p-4 border-l overflow-y-auto max-h-[30vh] md:max-h-full">
           <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">بيانات الاختبار</h3>
           
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">اسم الاختبار <span className="text-red-500">*</span></label>
               <input type="text" className="w-full border p-2 rounded bg-white" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: اختبار منتصف الفصل" />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
               <input type="text" className="w-full border p-2 rounded bg-white" value={subject} onChange={e => setSubject(e.target.value)} placeholder="مثال: رياضيات" />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">الصف الدراسية</label>
               <input type="text" className="w-full border p-2 rounded bg-white" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} placeholder="مثال: الخامس" />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">اسم المدرسة</label>
               <input type="text" className="w-full border p-2 rounded bg-white" value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="اسم المدرسة (يظهر في الورقة)" />
             </div>
           </div>

           <h3 className="font-bold text-gray-700 mt-8 mb-4 border-b pb-2">إعدادات ورقة الإجابة</h3>
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عدد الأعمدة</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(n => (
                    <button 
                      key={n}
                      onClick={() => setColumnCount(n)}
                      className={`flex-1 py-2 border rounded ${columnCount === n ? 'bg-secondary text-white border-secondary' : 'bg-white hover:bg-gray-100'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">يحدد كيفية توزيع الأسئلة في ورقة الإجابة المطبوعة.</p>
              </div>
           </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700">الأسئلة ({questions.length})</h3>
             <button 
               onClick={addQuestion}
               className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-1 shadow-sm"
             >
               <span>➕</span> إضافة سؤال
             </button>
           </div>

           {questions.length === 0 ? (
             <div className="text-center py-10 text-gray-400 bg-white rounded border border-dashed">
               أضف أسئلة للبدء
             </div>
           ) : (
             <div className="space-y-3">
               {questions.map((q) => (
                 <div key={q.id} className="bg-white p-4 rounded shadow-sm border border-gray-200 flex items-center gap-4 animate-fade-in">
                    <span className="font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                      {q.number}
                    </span>
                    
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Type Selector */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">نوع السؤال</label>
                        <select 
                          className="w-full border rounded p-1 text-sm bg-gray-50"
                          value={q.type}
                          onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                        >
                          <option value={QuestionType.MCQ}>اختيار من متعدد</option>
                          <option value={QuestionType.TRUE_FALSE}>صواب / خطأ</option>
                          <option value={QuestionType.MATCHING}>مطابقة</option>
                        </select>
                      </div>

                      {/* Correct Answer Selector */}
                      <div>
                         <label className="block text-xs text-gray-500 mb-1">الإجابة الصحيحة</label>
                         <select 
                            className="w-full border rounded p-1 text-sm bg-green-50 border-green-200"
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                          >
                            {q.type === QuestionType.TRUE_FALSE ? (
                              <>
                                <option value="T">صواب (T)</option>
                                <option value="F">خطأ (F)</option>
                              </>
                            ) : (
                              LETTERS.slice(0, 4).map(l => (
                                <option key={l} value={l}>{l}</option>
                              ))
                            )}
                          </select>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeQuestion(q.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition"
                      title="حذف السؤال"
                    >
                      🗑️
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ExamForm;