import React, { useState, useEffect } from 'react';
import { Exam, StudentResult } from '../types';
import { getExams, getResultsByExamId } from '../utils/storage';

interface ReportsProps {
  onBack: () => void;
}

const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [results, setResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    const allExams = getExams();
    setExams(allExams);
    if (allExams.length > 0) {
      setSelectedExamId(allExams[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      setResults(getResultsByExamId(selectedExamId));
    }
  }, [selectedExamId]);

  // Statistics Calculation
  const totalStudents = results.length;
  const avgScore = totalStudents > 0 
    ? (results.reduce((acc, curr) => acc + curr.percentage, 0) / totalStudents).toFixed(1) 
    : 0;
  
  const maxScore = totalStudents > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const minScore = totalStudents > 0 ? Math.min(...results.map(r => r.score)) : 0;
  const passedStudents = results.filter(r => r.percentage >= 50).length;
  const passRate = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : 0;

  const currentExam = exams.find(e => e.id === selectedExamId);

  const handleExportPDF = () => {
    const originalTitle = document.title;
    const examName = currentExam ? currentExam.title : 'report';
    // Clean filename
    const safeName = examName.replace(/[^a-z0-9\u0600-\u06FF]/gi, '_');
    document.title = `Report_${safeName}_${new Date().toISOString().split('T')[0]}`;
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 500);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in print:max-w-none print:w-full print:p-0 print:m-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow no-print">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📊 التقارير والإحصائيات
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={handleExportPDF}
                className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 flex items-center gap-2 shadow"
            >
                <span>📄</span> حفظ كـ PDF
            </button>
            <button onClick={onBack} className="text-gray-600 border px-4 py-2 rounded hover:bg-gray-50">
            عودة للرئيسية
            </button>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded shadow">
           <p className="text-gray-500">لا توجد اختبارات لعرض تقاريرها.</p>
        </div>
      ) : (
        <div className="print:p-4">
          {/* Exam Selector */}
          <div className="mb-6 no-print">
            <label className="block text-sm font-bold text-gray-700 mb-2">اختر الاختبار:</label>
            <select 
              className="w-full md:w-1/3 border p-2 rounded shadow-sm bg-white"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title} - {e.gradeLevel}</option>
              ))}
            </select>
          </div>

          {/* Printable Header - Only visible on print */}
          <div className="hidden print:block mb-8 text-center border-b pb-4">
             <h1 className="text-3xl font-bold mb-2">{currentExam?.title}</h1>
             <p className="text-gray-600">تقرير النتائج الشامل - {new Date().toLocaleDateString('ar-SA')}</p>
             <div className="flex justify-center gap-4 mt-2 text-sm">
                <span>المادة: {currentExam?.subject}</span>
                <span>|</span>
                <span>الصف: {currentExam?.gradeLevel}</span>
             </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow border-r-4 border-blue-500 print:border print:shadow-none">
              <p className="text-gray-500 text-sm">عدد الطلاب</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
            <div className="bg-white p-4 rounded shadow border-r-4 border-yellow-500 print:border print:shadow-none">
              <p className="text-gray-500 text-sm">متوسط الدرجات</p>
              <p className="text-2xl font-bold">{avgScore}%</p>
            </div>
            <div className="bg-white p-4 rounded shadow border-r-4 border-green-500 print:border print:shadow-none">
              <p className="text-gray-500 text-sm">نسبة النجاح</p>
              <p className="text-2xl font-bold">{passRate}%</p>
            </div>
            <div className="bg-white p-4 rounded shadow border-r-4 border-purple-500 print:border print:shadow-none">
              <p className="text-gray-500 text-sm">أعلى درجة</p>
              <p className="text-2xl font-bold">{maxScore} <span className="text-xs text-gray-400">/ {currentExam?.questions.length}</span></p>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded shadow overflow-hidden print:shadow-none print:border">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 print:bg-gray-100">
               <h3 className="font-bold text-gray-700">سجل نتائج الطلاب</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100 text-gray-600 text-sm print:bg-gray-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">رقم الطالب (ID)</th>
                    <th className="p-3">تاريخ التصحيح</th>
                    <th className="p-3">الدرجة</th>
                    <th className="p-3">النسبة</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">لم يتم تصحيح أي أوراق لهذا الاختبار بعد.</td>
                    </tr>
                  ) : (
                    results.map((r, index) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3 font-mono">{r.studentId !== 'Unknown' ? r.studentId : '-'}</td>
                        <td className="p-3 text-sm text-gray-500">{new Date(r.timestamp).toLocaleString('ar-SA')}</td>
                        <td className="p-3 font-bold">{r.score} / {r.maxScore}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs text-white print:text-black print:border print:border-gray-300 ${r.percentage >= 90 ? 'bg-green-500' : r.percentage >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}>
                            {Math.round(r.percentage)}%
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {r.percentage >= 50 ? <span className="text-green-600 font-bold">ناجح</span> : <span className="text-red-600 font-bold">راسب</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;