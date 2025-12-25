import React, { useState, useEffect } from 'react';
import { Exam } from './types';
import { getExams, deleteExam, duplicateExam, getCurrentUser, logoutUser, User } from './utils/storage';
import ExamForm from './components/ExamForm';
import SheetRenderer from './components/SheetRenderer';
import Scanner from './components/Scanner';
import AuthScreen from './components/AuthScreen';
import Reports from './components/Reports';

type ViewState = 'DASHBOARD' | 'CREATE_EXAM' | 'VIEW_SHEET' | 'SCAN_EXAM' | 'REPORTS';

interface ConfirmModalState {
  show: boolean;
  type: 'DELETE' | 'LOGOUT';
  itemId?: string;
  message: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Sorting State
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Custom Confirm Modal State
  const [confirmState, setConfirmState] = useState<ConfirmModalState>({ show: false, type: 'LOGOUT', message: '' });

  useEffect(() => {
    // Check for logged in user
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    loadExams();
  }, [view]);

  const loadExams = () => {
    setExams(getExams());
  };

  const handleDuplicate = (id: string) => {
    const success = duplicateExam(id);
    if (success) {
      loadExams();
    } else {
      alert('فشل نسخ الاختبار');
    }
  };

  const triggerDelete = (id: string) => {
    setConfirmState({
      show: true,
      type: 'DELETE',
      itemId: id,
      message: 'هل أنت متأكد من حذف هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء.'
    });
  };

  const triggerLogout = () => {
    setConfirmState({
      show: true,
      type: 'LOGOUT',
      message: 'هل تريد تسجيل الخروج؟'
    });
  };

  const handleConfirmAction = () => {
    if (confirmState.type === 'DELETE' && confirmState.itemId) {
      deleteExam(confirmState.itemId);
      loadExams();
    } else if (confirmState.type === 'LOGOUT') {
      logoutUser();
      setUser(null);
      setView('DASHBOARD');
    }
    setConfirmState({ ...confirmState, show: false });
  };

  // Sort logic
  const sortedExams = [...exams].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.createdAt - a.createdAt;
    } else {
      return a.createdAt - b.createdAt;
    }
  });

  // Auth Guard
  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  // View Logic
  return (
    <div className="min-h-screen relative bg-background flex flex-col font-sans">
      {/* Navbar - Hidden in print */}
      <nav className="bg-dark text-white p-4 shadow-lg no-print sticky top-0 z-30 flex-shrink-0 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('DASHBOARD')}>
            <div className="bg-primary group-hover:bg-primaryHover text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors">
              📝
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold leading-none tracking-wide">المصحح الآلي</h1>
              <span className="text-xs text-gray-400 mt-1">أهلاً، {user.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {view !== 'DASHBOARD' && (
               <button 
                 onClick={() => setView('DASHBOARD')}
                 className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition"
               >
                 🏠 الرئيسية
               </button>
             )}
             <button 
               onClick={() => setView('REPORTS')}
               className="text-sm bg-secondary hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm"
             >
               <span>📊</span> التقارير
             </button>
             <button 
               onClick={triggerLogout}
               className="text-sm bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 px-4 py-2 rounded-lg transition"
             >
               خروج
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto md:p-8 p-4">
        
        {view === 'DASHBOARD' && (
          <div className="animate-fade-in no-print">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
               <h2 className="text-2xl font-bold text-gray-800">اختباراتي</h2>
               
               <div className="flex items-center gap-3 w-full md:w-auto">
                 {/* Sort Dropdown */}
                 <div className="relative">
                    <select 
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                      className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    >
                      <option value="newest">🆕 الأحدث أولاً</option>
                      <option value="oldest">📅 الأقدم أولاً</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                 </div>

                 <button 
                   onClick={() => setView('CREATE_EXAM')}
                   className="flex-1 md:flex-none bg-primary hover:bg-primaryHover text-white px-5 py-2 rounded-lg font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95"
                 >
                   <span>➕</span> إنشاء اختبار
                 </button>
               </div>
             </div>

             {sortedExams.length === 0 ? (
               <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 mx-auto max-w-lg">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 text-gray-300">
                   📄
                 </div>
                 <p className="text-xl text-gray-500 font-medium mb-2">لا توجد اختبارات حالياً</p>
                 <p className="text-gray-400 text-sm mb-6">قم بإنشاء اختبارك الأول للبدء في عملية التصحيح</p>
                 <button 
                    onClick={() => setView('CREATE_EXAM')}
                    className="text-primary font-bold hover:text-primaryHover hover:underline transition"
                 >
                    ابدأ بإنشاء أول اختبار
                 </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                 {sortedExams.map(exam => (
                   <div key={exam.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col group">
                      <div className="p-5 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50 relative">
                        <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-bold text-lg text-gray-800 line-clamp-1" title={exam.title}>{exam.title}</h3>
                           <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-mono font-bold border border-indigo-100">
                             {exam.questions.length} س
                           </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          {exam.subject} • {exam.gradeLevel}
                        </p>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                          🕒 {new Date(exam.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white flex flex-col gap-3 mt-auto">
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => { setSelectedExam(exam); setView('SCAN_EXAM'); }}
                            className="bg-primary/5 border border-primary/20 text-primary py-2.5 rounded-lg font-bold hover:bg-primary hover:text-white transition-all text-sm flex justify-center items-center gap-2"
                          >
                            📷 تصحيح
                          </button>
                          <button 
                            onClick={() => { setSelectedExam(exam); setView('VIEW_SHEET'); }}
                            className="bg-gray-50 border border-gray-200 text-gray-600 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-all text-sm flex justify-center items-center gap-2"
                          >
                            📄 الورقة
                          </button>
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-gray-50">
                           <button 
                             onClick={() => handleDuplicate(exam.id)}
                             className="flex-1 text-xs text-gray-500 hover:text-secondary py-1 flex items-center justify-center gap-1 hover:bg-gray-50 rounded transition"
                           >
                             📑 نسخ
                           </button>
                           <div className="w-px bg-gray-200 my-1"></div>
                           <button 
                             onClick={() => triggerDelete(exam.id)}
                             className="flex-1 text-xs text-gray-400 hover:text-red-500 py-1 flex items-center justify-center gap-1 hover:bg-red-50 rounded transition"
                           >
                             🗑️ حذف
                           </button>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {view === 'CREATE_EXAM' && (
          <div className="no-print h-full">
            <ExamForm 
              onCancel={() => setView('DASHBOARD')} 
              onSave={() => { setView('DASHBOARD'); loadExams(); }} 
            />
          </div>
        )}

        {view === 'VIEW_SHEET' && selectedExam && (
          <SheetRenderer 
            exam={selectedExam} 
            onBack={() => setView('DASHBOARD')} 
          />
        )}

        {view === 'SCAN_EXAM' && selectedExam && (
          <div className="no-print">
            <Scanner 
              exam={selectedExam} 
              onBack={() => setView('DASHBOARD')} 
            />
          </div>
        )}

        {view === 'REPORTS' && (
          <div className="no-print">
            <Reports onBack={() => setView('DASHBOARD')} />
          </div>
        )}

      </main>

      {/* Confirmation Modal */}
      {confirmState.show && (
        <div className="fixed inset-0 bg-dark/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${confirmState.type === 'DELETE' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
                {confirmState.type === 'DELETE' ? '⚠️' : '🚪'}
             </div>
             <h3 className="text-lg font-bold mb-2 text-gray-800 text-center">
               {confirmState.type === 'DELETE' ? 'حذف الاختبار؟' : 'تسجيل الخروج؟'}
             </h3>
             <p className="text-gray-500 mb-6 text-center text-sm leading-relaxed">{confirmState.message}</p>
             <div className="flex justify-center gap-3">
               <button 
                 onClick={() => setConfirmState({ ...confirmState, show: false })}
                 className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
               >
                 إلغاء
               </button>
               <button 
                 onClick={handleConfirmAction}
                 className={`px-5 py-2.5 rounded-lg text-white font-bold shadow-md transition transform active:scale-95 ${confirmState.type === 'DELETE' ? 'bg-red-500 hover:bg-red-600' : 'bg-dark hover:bg-black'}`}
               >
                 {confirmState.type === 'DELETE' ? 'نعم، حذف' : 'نعم، خروج'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;