
import React, { useState, useEffect } from 'react';
import { Exam, QuestionType, LETTERS, Question } from '../types';
import { saveExam } from '../utils/storage';

interface SheetRendererProps {
  exam: Exam;
  onBack: () => void;
}

const SheetRenderer: React.FC<SheetRendererProps> = ({ exam, onBack }) => {
  const [localExam, setLocalExam] = useState<Exam>(exam);
  const [hasChanges, setHasChanges] = useState(false);
  const [simulatedId, setSimulatedId] = useState<string>('');

  useEffect(() => {
    setLocalExam(exam);
    setHasChanges(false);
  }, [exam]);

  const updateField = (field: keyof Exam, value: any) => {
    setLocalExam(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateLayout = (field: string, value: any) => {
    setLocalExam(prev => ({
      ...prev,
      layoutConfig: {
        ...prev.layoutConfig,
        [field]: value
      } as any
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveExam(localExam);
    setHasChanges(false);
    alert("تم حفظ التعديلات بنجاح.");
  };

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    const safeTitle = (localExam.title || 'Exam_Sheet').replace(/[^a-z0-9\u0600-\u06FF]/gi, '_');
    
    // إخطار المستخدم بكيفية الحفظ
    const confirmPrint = window.confirm("سيتم فتح نافذة الطباعة. يرجى اختيار 'Save as PDF' أو 'حفظ بتنسيق PDF' من قائمة الطابعات لحفظ الورقة.");
    
    if (confirmPrint) {
      document.title = safeTitle;
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }, 200);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative text-right overflow-hidden" dir="rtl">
      {/* Fixed Sticky Toolbar */}
      <div className="bg-white/90 backdrop-blur-md shadow-sm p-4 flex justify-between items-center no-print z-[100] sticky top-0 shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">معاينة ورقة الإجابة</h2>
          {hasChanges && (
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
              توجد تغييرات غير محفوظة
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-bold shadow-sm transition-all cursor-pointer transform active:scale-95"
            >
              حفظ التعديلات
            </button>
          )}
          
          <button 
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all cursor-pointer bg-white"
          >
            عودة
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            className="px-8 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer transform active:scale-95"
          >
            <span>📄</span> تصدير وحفظ PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar - Independent Scroll */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto no-print z-20 shadow-lg flex flex-col shrink-0">
            <div className="p-5 border-b bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span>⚙️</span> خصائص الورقة
                </h3>
            </div>
            
            <div className="p-5 space-y-6">
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">رأس الصفحة</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المدرسة</label>
                        <input 
                            type="text" 
                            value={localExam.schoolName}
                            onChange={(e) => updateField('schoolName', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الاختبار</label>
                        <input 
                            type="text" 
                            value={localExam.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
                            <input 
                                type="text" 
                                value={localExam.subject}
                                onChange={(e) => updateField('subject', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الصف</label>
                            <input 
                                type="text" 
                                value={localExam.gradeLevel}
                                onChange={(e) => updateField('gradeLevel', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">معاينة رقم الطالب (ID)</h4>
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <input 
                            type="text" 
                            maxLength={5}
                            placeholder="أدخل رقماً للمعاينة"
                            value={simulatedId}
                            onChange={(e) => setSimulatedId(e.target.value.replace(/\D/g, ''))}
                            className="w-full border border-blue-200 rounded-lg p-2 text-center font-mono outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4 pb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">التنسيق</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الأعمدة</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {[1, 2, 3].map(num => (
                                <button
                                    key={num}
                                    onClick={() => updateLayout('columnCount', num)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                        localExam.layoutConfig?.columnCount === num 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">حجم الفقاعات</label>
                        <div className="grid grid-cols-3 gap-2">
                             {['sm', 'md', 'lg'].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => updateLayout('bubbleSize', size)}
                                    className={`py-2 text-sm border rounded-lg transition-all ${
                                        (localExam.layoutConfig?.bubbleSize || 'md') === size
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {size === 'sm' ? 'صغير' : size === 'md' ? 'وسط' : 'كبير'}
                                </button>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Preview Area - Independent Scroll */}
        <div className="flex-1 overflow-auto p-8 flex justify-center no-print bg-gray-200/50">
            <div className="bg-white shadow-2xl relative shrink-0 transition-all duration-300" style={{ width: '210mm', height: '297mm' }}>
                <SheetPaper exam={localExam} simulatedId={simulatedId} />
            </div>
        </div>
      </div>

      {/* Print Specific Container */}
      <div className="print-only">
        <SheetPaper exam={localExam} simulatedId={simulatedId} />
      </div>
    </div>
  );
};

const SheetPaper: React.FC<{ exam: Exam, simulatedId?: string }> = ({ exam, simulatedId = '' }) => {
  const totalQuestions = exam.questions.length;
  const colCount = exam.layoutConfig?.columnCount || 2;
  const questionsPerCol = Math.ceil(totalQuestions / colCount);
  const bubbleSize = exam.layoutConfig?.bubbleSize || 'md';
  const bubbleSpacing = exam.layoutConfig?.bubbleSpacing || 'normal';

  const rowHeightClass = {
      sm: 'h-[2.8%]',
      md: 'h-[3.3%]',
      lg: 'h-[4.0%]'
  }[bubbleSize] || 'h-[3.0%]';

  const columns: Question[][] = [];
  for (let i = 0; i < colCount; i++) {
    columns.push(exam.questions.slice(i * questionsPerCol, (i + 1) * questionsPerCol));
  }

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const idColumns = [0, 1, 2, 3, 4];

  return (
    <div className="w-full h-full relative p-0 text-black font-sans bg-white" dir="rtl">
      <div className="absolute top-[30px] left-[30px] w-[20px] h-[20px] bg-black"></div>
      <div className="absolute top-[30px] right-[30px] w-[20px] h-[20px] bg-black"></div>
      <div className="absolute bottom-[30px] left-[30px] w-[20px] h-[20px] bg-black"></div>
      <div className="absolute bottom-[30px] right-[30px] w-[20px] h-[20px] bg-black"></div>

      <div className="absolute top-[60px] left-[60px] right-[60px] h-[28%] flex flex-col gap-4">
        <div className="text-center border-b-2 border-black pb-2">
           <h1 className="text-2xl font-bold mb-1">{exam.schoolName || 'اسم المدرسة'}</h1>
           <div className="flex justify-between px-10 text-lg font-semibold mt-2">
             <span>الاختبار: {exam.title}</span>
             <span>المادة: {exam.subject}</span>
             {exam.gradeLevel && <span>الصف: {exam.gradeLevel}</span>}
           </div>
        </div>

        <div className="flex justify-between items-stretch gap-4 mt-2">
           <div className="flex-1 border-2 border-black p-2 rounded relative">
              <span className="text-sm font-bold block mb-1">اسم الطالب:</span>
              <div className="absolute bottom-10 left-4 right-4 border-b border-black border-dashed"></div>
           </div>

           <div className="w-[180px] border-2 border-black p-2 rounded flex flex-col items-center bg-white min-h-[190px]">
              <span className="text-[10px] font-bold mb-2 uppercase">رقم الطالب (Student ID)</span>
              <div className="flex gap-2 w-full justify-center" dir="ltr">
                 {idColumns.map(colIdx => {
                   const digitChar = simulatedId[colIdx];
                   const filledDigit = digitChar !== undefined ? parseInt(digitChar) : null;
                   return (
                     <div key={colIdx} className="flex flex-col items-center">
                        <div className="w-5 h-5 border-b-2 border-black mb-1.5 flex items-center justify-center font-bold text-[10px] bg-gray-50">
                           {digitChar || ''}
                        </div>
                        <div className="flex flex-col gap-[2px]">
                          {digits.map(digit => (
                            <div 
                              key={digit} 
                              className={`w-[13px] h-[13px] rounded-full border border-black flex items-center justify-center ${filledDigit === digit ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                              <span className="text-[7px] font-bold leading-none">{digit}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      </div>

      <div className="absolute top-[40%] left-[8%] right-[8%] bottom-[5%] flex gap-8">
        {columns.map((colQuestions, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col border-r last:border-0 border-gray-300 pr-2 last:pr-0">
             {colQuestions.map((q) => (
               <div key={q.id} className={`flex items-center w-full ${rowHeightClass}`}>
                 <span className="font-bold w-6 text-left ml-2 text-xs font-mono">{q.number}</span>
                 {renderBubbles(q, bubbleSize, bubbleSpacing)}
               </div>
             ))}
          </div>
        ))}
      </div>

      <div className="absolute bottom-2 w-full text-center text-[10px] text-gray-400 font-mono">
         Q-CODE: {exam.id.split('-')[0]} | AUTO-GRADER v2.5
      </div>
    </div>
  );
};

const renderBubbles = (q: Question, size: 'sm' | 'md' | 'lg', spacing: 'compact' | 'normal' | 'wide') => {
  const sizeMap = {
      sm: { dim: 'w-[12px] h-[12px]', text: 'text-[7px]' },
      md: { dim: 'w-[16px] h-[16px]', text: 'text-[9px]' },
      lg: { dim: 'w-[20px] h-[20px]', text: 'text-[10px]' },
  };

  const spacingMap = {
    compact: 'mx-[1px]',
    normal: 'mx-[3px]',
    wide: 'mx-[6px]',
  };
  
  const { dim, text } = sizeMap[size] || sizeMap.md;
  const marginClass = spacingMap[spacing] || spacingMap.normal;
  const bubbleClass = `${dim} rounded-full border border-black flex items-center justify-center ${text} font-bold ${marginClass}`;

  if (q.type === QuestionType.TRUE_FALSE) {
    return (
      <div className="flex flex-1 items-center" dir="ltr">
         <div className={bubbleClass}>F</div>
         <div className={bubbleClass}>T</div>
      </div>
    );
  }

  const options = LETTERS.slice(0, 4); 
  return (
    <div className="flex flex-1 items-center" dir="ltr">
      {options.map(l => (
        <div key={l} className={bubbleClass}>{l}</div>
      ))}
    </div>
  );
};

export default SheetRenderer;
