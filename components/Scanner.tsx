
import React, { useRef, useState, useEffect } from 'react';
import { Exam, StudentResult } from '../types';
import { gradeExam } from '../utils/omrEngine';
import { saveResult } from '../utils/storage';

interface ScannerProps {
  exam: Exam;
  onBack: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ exam, onBack }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle camera lifecycle
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      if (isCameraActive) {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('NotSupportedError');
          }

          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // التأكد من تشغيل الفيديو فور تحميله
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => console.error("Video play failed", e));
            };
          }
        } catch (err: any) {
          console.error("Error accessing camera:", err);
          let errorMsg = "حدث خطأ عند محاولة الوصول للكاميرا.";
          const errorName = err.name || err.message;

          if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
            errorMsg = "تم رفض إذن الوصول للكاميرا. يرجى تفعيل الإذن من إعدادات المتصفح أو الموقع.";
          } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
            errorMsg = "لم يتم العثور على كاميرا في هذا الجهاز.";
          } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
            errorMsg = "الكاميرا مستخدمة حالياً من قبل تطبيق آخر.";
          } else if (errorName === 'SecurityError') {
            errorMsg = "خطأ أمني: الكاميرا تتطلب اتصالاً آمناً (HTTPS) أو أن المتصفح يمنع الوصول في هذا السياق.";
          } else if (errorName === 'NotSupportedError') {
            errorMsg = "متصفحك لا يدعم الوصول للكاميرا بشكل مباشر.";
          }
          
          alert(errorMsg);
          setIsCameraActive(false);
        }
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // استخدام الأبعاد الحقيقية للفيديو
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImageSrc(dataUrl);
        setIsCameraActive(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processExam = () => {
    if (!imageSrc || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);

      try {
        const detectedAnswers = gradeExam(
          canvas, 
          exam.questions, 
          { 
            columnCount: exam.layoutConfig?.columnCount || 2,
            bubbleSize: exam.layoutConfig?.bubbleSize || 'md'
          }
        );

        let correctCount = 0;
        const answersMap: Record<number, string> = {};

        detectedAnswers.forEach(ans => {
          if (ans.detected) {
            answersMap[ans.questionNum] = ans.detected;
            const correct = exam.questions.find(q => q.number === ans.questionNum)?.correctAnswer;
            if (correct === 'T' && ans.detected === 'T') correctCount++;
            else if (correct === 'F' && ans.detected === 'F') correctCount++;
            else if (correct === ans.detected) correctCount++;
          }
        });

        const finalScore = correctCount;
        const percentage = (finalScore / exam.questions.length) * 100;

        const newResult: StudentResult = {
          id: crypto.randomUUID(),
          examId: exam.id,
          studentId: 'Unknown', 
          score: finalScore,
          maxScore: exam.questions.length,
          percentage,
          answers: answersMap,
          timestamp: Date.now(),
          imageUrl: imageSrc
        };

        saveResult(newResult);
        setResult(newResult);

      } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء المعالجة. يرجى التأكد من وضوح الصورة ومكان المربعات السوداء.");
      } finally {
        setIsProcessing(false);
      }
    };
  };

  if (result) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto bg-white min-h-screen md:min-h-0 md:rounded-2xl md:shadow-xl text-center animate-fade-in border border-gray-100">
        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-4xl font-bold text-white mb-6 shadow-lg ${result.percentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`}>
          {Math.round(result.percentage)}%
        </div>
        <h2 className="text-3xl font-bold mb-2 text-gray-800">النتيجة: {result.score} / {result.maxScore}</h2>
        <p className="text-gray-500 mb-8">تم حفظ النتيجة بنجاح في السجلات</p>

        <div className="text-right border border-gray-200 rounded-xl p-4 h-64 overflow-y-auto mb-6 bg-gray-50 shadow-inner">
           <h3 className="font-bold border-b pb-2 mb-3 text-gray-700">تفاصيل الإجابات:</h3>
           {exam.questions.map(q => {
             const studentAns = result.answers[q.number];
             const isCorrect = studentAns === q.correctAnswer;
             return (
               <div key={q.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                 <span className="font-bold text-gray-600">س {q.number}</span>
                 <div className="flex gap-4">
                   <span className="font-mono text-sm">
                     الطالب: <span className={isCorrect ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{studentAns || '-'}</span>
                   </span>
                   <span className="font-mono text-sm text-gray-400">
                     (الصحيحة: {q.correctAnswer})
                   </span>
                 </div>
                 <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
               </div>
             )
           })}
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={() => { setResult(null); setImageSrc(null); }} 
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md font-bold transition-all"
          >
            📸 تصحيح ورقة أخرى
          </button>
          <button 
            onClick={onBack} 
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all bg-white"
          >
            عودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  if (isCameraActive) {
    return (
      <div className="fixed inset-0 z-[150] bg-black flex flex-col">
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
             <span className="text-white font-bold drop-shadow-md">وضع التصوير المباشر</span>
           </div>
           <button 
             onClick={() => setIsCameraActive(false)}
             className="bg-white/10 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm border border-white/20 hover:bg-white/20 transition-all"
           >
             إلغاء
           </button>
        </div>

        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted
             className="w-full h-full object-contain"
           ></video>
           
           <div className="absolute inset-4 md:inset-10 border-2 border-dashed border-white/40 rounded-3xl pointer-events-none flex items-center justify-center">
              <div className="w-[80%] h-[1px] bg-white/20 absolute"></div>
              <div className="h-[80%] w-[1px] bg-white/20 absolute"></div>
              
              <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
              
              <div className="bg-black/40 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm mb-auto mt-10">
                 قم بمحاذاة المربعات السوداء الأربعة مع الزوايا
              </div>
           </div>
        </div>

        <div className="bg-black/95 p-8 flex justify-center items-center pb-12 relative">
           <button 
             onClick={captureImage}
             className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
           >
             <div className="w-16 h-16 rounded-full bg-white group-hover:bg-gray-100"></div>
           </button>
        </div>
        
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-gray-800">تصحيح: {exam.title}</h2>
         <button onClick={onBack} className="text-gray-600 border border-gray-300 px-4 py-2 rounded-xl hover:bg-white hover:shadow-sm transition-all bg-gray-50/50">عودة</button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            {!imageSrc ? (
              <div className="flex flex-col gap-6 items-center text-center w-full">
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center text-4xl mb-2 rotate-3 hover:rotate-0 transition-transform">
                  📷
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">التقاط صورة للورقة</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">استخدم الكاميرا للمسح المباشر أو ارفع ملف صورة موجود مسبقاً</p>
                </div>
                
                <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                  <button 
                    onClick={() => setIsCameraActive(true)} 
                    className="w-full bg-dark text-white py-4 rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">📸</span> 
                    <span className="font-bold">فتح الكاميرا المباشرة</span>
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full border border-gray-200 bg-white text-gray-700 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3"
                    >
                      <span className="text-lg">📂</span> 
                      <span className="font-bold">رفع من ملفات الجهاز</span>
                    </button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <img src={imageSrc} alt="Scanned" className="w-full rounded-xl border border-gray-200 shadow-sm" />
                <button 
                  onClick={() => setImageSrc(null)}
                  className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg hover:bg-red-700 transition-all font-bold"
                >
                  إزالة الصورة
                </button>
              </div>
            )}
         </div>

         <div className="flex flex-col gap-6">
            <div className="bg-blue-50/50 p-6 rounded-2xl text-sm text-blue-900 border border-blue-100 shadow-sm">
               <strong className="block mb-3 text-lg flex items-center gap-2">
                 <span className="text-blue-500 text-xl">💡</span>
                 تعليمات التصحيح الدقيق:
               </strong>
               <ul className="space-y-3 text-blue-800/80">
                 <li className="flex gap-2">
                   <span className="text-blue-500 font-bold">•</span>
                   <span>تأكد من وجود <strong>إضاءة جيدة</strong> ومركزة على كامل الورقة.</span>
                 </li>
                 <li className="flex gap-2">
                   <span className="text-blue-500 font-bold">•</span>
                   <span>يجب أن تظهر <strong>المربعات السوداء الأربعة</strong> بوضوح في الزوايا.</span>
                 </li>
                 <li className="flex gap-2">
                   <span className="text-blue-500 font-bold">•</span>
                   <span>اجعل الكاميرا موازية تماماً للورقة وتجنب الميلان الحاد.</span>
                 </li>
                 <li className="flex gap-2">
                   <span className="text-blue-500 font-bold">•</span>
                   <span>تأكد من عدم وجود ظلال أو انعكاسات قوية على منطقة الإجابات.</span>
                 </li>
               </ul>
            </div>

            <button 
              onClick={processExam}
              disabled={!imageSrc || isProcessing}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-emerald-700 hover:shadow-2xl disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري تحليل الورقة...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>بدء التصحيح الذكي</span>
                </>
              )}
            </button>
            
            <canvas ref={canvasRef} className="hidden"></canvas>
         </div>
       </div>
    </div>
  );
};

export default Scanner;
