import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react"; // إضافة الهوكس
import { supabase } from "@/integrations/supabase/client"; // استدعاء سوبا بيز
import { Session } from "@supabase/supabase-js"; // استدعاء نوع الجلسة
import Index from "./pages/Index";
import Login from "./pages/Login"; // هام: تأكد أنك أنشأت ملف Login.tsx كما اتفقنا
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // 1. متغيرات لتخزين حالة المستخدم (مسجل دخول أم لا)
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. التحقق من الجلسة عند فتح الموقع
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 3. الاستماع لأي تغيير (تسجيل دخول أو خروج)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 4. شاشة تحميل سوداء ريثما يتأكد من الدخول
  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6952E0] border-t-transparent"></div>
          <p>Verifying Access...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 5. المعادلة السحرية: إذا في جلسة اعرض الموقع، وإلا اعرض صفحة الدخول */}
            <Route path="/" element={session ? <Index /> : <Login />} />
            
            {/* المسارات الأخرى */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;