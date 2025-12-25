import React, { useState } from 'react';
import { loginUser, registerUser, User } from '../utils/storage';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('الرجاء تعبئة جميع الحقول');
      return;
    }

    if (isRegister) {
      if (!name) {
        setError('الرجاء إدخال الاسم الكامل');
        return;
      }
      const success = registerUser({ name, username, password });
      if (success) {
        // Auto login after register
        const user = loginUser(username, password);
        if (user) onLogin(user);
      } else {
        setError('اسم المستخدم مسجل مسبقاً');
      }
    } else {
      const user = loginUser(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('بيانات الدخول غير صحيحة');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-dark p-6 text-center">
          <span className="text-4xl block mb-2">📝</span>
          <h1 className="text-2xl font-bold text-white">المصحح الآلي الذكي</h1>
          <p className="text-gray-300 text-sm">منصة تصحيح الاختبارات للمعلمين</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
            {isRegister ? 'إنشاء حساب معلم جديد' : 'تسجيل الدخول'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-primary outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-primary outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-primary outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="mt-2 bg-primary text-white py-2 rounded font-bold hover:bg-emerald-600 transition"
            >
              {isRegister ? 'إنشاء حساب' : 'دخول'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isRegister ? (
              <p>لديك حساب بالفعل؟ <button onClick={() => setIsRegister(false)} className="text-blue-600 font-bold hover:underline">تسجيل الدخول</button></p>
            ) : (
              <p>ليس لديك حساب؟ <button onClick={() => setIsRegister(true)} className="text-blue-600 font-bold hover:underline">إنشاء حساب جديد</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
