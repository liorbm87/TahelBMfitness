import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import SignatureCanvas from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import { 
  Calendar, Users, Settings, LogOut, Check, X, CreditCard, MessageCircle, 
  Download, Upload, Plus, Trash2, AlertCircle, CheckCircle2, Clock, 
  DollarSign, Edit, Search, Send, FileText, ChevronRight, Filter, Eye, 
  Lock, RefreshCw, Award, ChevronDown, CheckSquare, Square, Phone, ShieldAlert
} from 'lucide-react';

// ============================================================================
// 1. הגדרות SUPABASE וקונפיגורציה
// ============================================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// 2. נתוני ברירת מחדל וסימולציה (LOCAL STORAGE FALLBACK)
// ============================================================================
const DEFAULT_SETTINGS = {
  logoUrl: '',
  backgroundUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2070&auto=format&fit=crop',
  adminPassword: '2024',
  makeWebhookUrl: '',
  cloudinaryCloudName: 'mryir3yi',
  cloudinaryPreset: 'tahel_images'
};

const INITIAL_WORKOUTS = [
  {
    id: 'w1',
    type: 'אימון כוח וחיטוב',
    date: '2026-09-02',
    time: '18:00',
    location: 'סטודיו מרכזי, הוד השרון',
    price: 70,
    max_participants: 10,
    notes: 'להביא מגבת ומים. עבודה על פלג גוף עליון.',
    created_at: new Date().toISOString()
  },
  {
    id: 'w2',
    type: 'פילאטיס דינמי',
    date: '2026-09-03',
    time: '09:00',
    location: 'סטודיו מרכזי, הוד השרון',
    price: 65,
    max_participants: 8,
    notes: 'אימון מזרן ורצועות. מותאם לכל הרמות.',
    created_at: new Date().toISOString()
  },
  {
    id: 'w3',
    type: 'אימון תחנות HIIT',
    date: '2026-08-25', // אימון עבר לדוגמה בשביל התראות חוב
    time: '19:30',
    location: 'פארק 4 עונות',
    price: 60,
    max_participants: 12,
    notes: 'אימון עצים באוויר הפתוח',
    created_at: new Date().toISOString()
  }
];

const INITIAL_TRAINEES = [
  {
    id: 'u1',
    full_name: 'עדי כהן',
    phone: '0501234567',
    email: 'adi@example.com',
    is_approved: true,
    is_admin: false,
    created_at: '2026-08-20T10:00:00Z',
    health_declaration: {
      has_medical_condition: false,
      medical_notes: 'אין',
      signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signed_at: '2026-08-20'
    }
  },
  {
    id: 'u2',
    full_name: 'דנה לוי',
    phone: '0529876543',
    email: 'dana@example.com',
    is_approved: true,
    is_admin: false,
    created_at: '2026-08-22T14:30:00Z',
    health_declaration: {
      has_medical_condition: true,
      medical_notes: 'רגישות בברך שמאל',
      signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signed_at: '2026-08-22'
    }
  },
  {
    id: 'u3',
    full_name: 'מיה שרון',
    phone: '0541112233',
    email: 'maya@example.com',
    is_approved: false, // ממתינה לאישור
    is_admin: false,
    created_at: '2026-08-30T09:15:00Z',
    health_declaration: {
      has_medical_condition: false,
      medical_notes: 'אין משהו מיוחד',
      signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signed_at: '2026-08-30'
    }
  }
];

const INITIAL_REGISTRATIONS = [
  { id: 'r1', workout_id: 'w1', user_id: 'u1', payment_status: 'paid', created_at: '2026-08-28T10:00:00Z' },
  { id: 'r2', workout_id: 'w1', user_id: 'u2', payment_status: 'unpaid', created_at: '2026-08-28T11:00:00Z' },
  { id: 'r3', workout_id: 'w3', user_id: 'u2', payment_status: 'unpaid', created_at: '2026-08-24T12:00:00Z' }, // חוב על אימון שעבר
];

const INITIAL_WAITLIST = [];

// ============================================================================
// 3. פונקציות עזר (WHATSAPP, CLOUDINARY, MAKE.COM, PDF)
// ============================================================================
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '972' + clean.substring(1);
  }
  return clean;
};

const openWhatsApp = (phone, message) => {
  const formatted = formatPhoneForWhatsApp(phone);
  const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

const triggerMakeWebhook = async (webhookUrl, eventType, data) => {
  if (!webhookUrl) {
    console.log('[Make.com Webhook Simulated]:', eventType, data);
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), ...data })
    });
  } catch (err) {
    console.error('Make Webhook error:', err);
  }
};

const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
  if (!cloudName || !uploadPreset) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  return data.secure_url;
};

const exportToPdf = (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const opt = {
    margin:       10,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
};

// ============================================================================
// 4. כותרת, לוגו מרכזי ואזור אישי (MAIN HEADER)
// ============================================================================
const MainHeader = ({ settings, isAdmin, onOpenAdminLogin, onLogout, currentUser, setCurrentUser, setTrainees }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '' });

  const openEditModal = () => {
    if (currentUser) {
      setEditForm({ full_name: currentUser.full_name, phone: currentUser.phone, email: currentUser.email });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = { ...currentUser, ...editForm };
    setCurrentUser(updatedUser);
    setTrainees(prev => prev.map(t => t.id === currentUser.id ? updatedUser : t));
    setIsEditModalOpen(false);
    alert('הפרטים עודכנו בהצלחה!');
  };

  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-6">
      {/* לוגו מרכזי גדול */}
      <div
        onDoubleClick={onOpenAdminLogin}
        className="cursor-pointer select-none transition transform hover:scale-105 active:scale-95"
        title="דאבל קליק: כניסת מנהלת"
      >
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="תהל כושר" className="h-32 sm:h-40 object-contain drop-shadow-xl" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-xl">
              ת
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 via-amber-800 to-amber-600 bg-clip-text text-transparent">
                תהל פיטנס
              </h1>
            </div>
          </div>
        )}
      </div>

      {/* תפריט פעולות מרכזי (למנהלת או למתאמן) */}
      {isAdmin ? (
        <div className="flex items-center gap-4 bg-white/80 p-3 rounded-2xl shadow-sm border border-amber-100">
          <span className="bg-amber-100 text-amber-800 text-sm px-4 py-2 rounded-full font-bold flex items-center gap-1">
            <ShieldAlert size={16} /> פאנל מנהלת פעיל
          </span>
          <button
            onClick={onLogout}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition"
          >
            <LogOut size={16} /> יציאה מהניהול
          </button>
        </div>
      ) : currentUser?.is_approved ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full px-4">
          <button
            onClick={openEditModal}
            className="w-full sm:w-auto text-sm font-bold text-gray-800 bg-white hover:bg-gray-50 px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm border border-gray-200"
            title="לחצי לעריכת פרטים אישיים"
          >
            <Edit size={16} className="text-amber-600" />
            שלום, {currentUser.full_name}
          </button>
          <button
            onClick={() => openWhatsApp('0501234567', 'היי תהל, אשמח להתייעץ איתך!')}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <MessageCircle size={18} />
            דברי איתי
          </button>
        </div>
      ) : null}

      {/* מודאל עריכת פרטים אישיים */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-amber-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">עריכת פרטים אישיים</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">שם מלא</label>
                <input required type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">טלפון</label>
                <input required type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">אימייל</label>
                <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition shadow-md mt-2">
                שמירת שינויים
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. מודאל התחברות נסתרת של המנהלת (DOUBLE CLICK MODAL)
// ============================================================================
const AdminLoginModal = ({ isOpen, onClose, onLogin, currentPassword }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === currentPassword) {
      onLogin();
      setPasswordInput('');
      setError('');
      onClose();
    } else {
      setError('סיסמה שגויה! אנא נסי שוב.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-amber-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Lock size={22} />
            <h3 className="font-bold text-lg text-gray-900">כניסת מנהלת נסתרת</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          הזני את סיסמת המנהלת לכניסה לפאנל הניהול של תהל.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="הזני סיסמה..."
              className="w-full p-3 border border-gray-300 rounded-xl text-center text-lg font-bold tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1 text-center font-semibold">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-gray-900 to-amber-900 text-white font-bold py-3 rounded-xl hover:opacity-95 transition shadow-lg"
          >
            התחברי לפאנל
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 6. תצוגת מתאמן/ת (USER VIEW) - הרשמה, הצהרת בריאות, אימונים וביטולים
// ============================================================================
const UserView = ({ 
  trainees, setTrainees, 
  workouts, 
  registrations, setRegistrations, 
  waitlist, setWaitlist,
  currentUser, setCurrentUser,
  settings 
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    has_medical_condition: false,
    medical_notes: '',
    terms_accepted: false
  });
  const [activeTab, setActiveTab] = useState('schedule');
  const sigCanvasRef = useRef({});

  const isRegistered = !!currentUser;
  const isApproved = currentUser?.is_approved;

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!formData.terms_accepted) {
      alert('יש לאשר את תקנון האתר ומדיניות הביטולים.');
      return;
    }
    if (sigCanvasRef.current.isEmpty && sigCanvasRef.current.isEmpty()) {
      alert('חובה לחתום בתיבת החתימה הדיגיטלית.');
      return;
    }

    const signatureData = sigCanvasRef.current.toDataURL();

    const newTrainee = {
      id: 'u_' + Date.now(),
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      is_approved: false,
      is_admin: false,
      created_at: new Date().toISOString(),
      health_declaration: {
        has_medical_condition: formData.has_medical_condition,
        medical_notes: formData.medical_notes,
        signature_url: signatureData,
        signed_at: new Date().toLocaleDateString('he-IL')
      }
    };

    setTrainees(prev => [...prev, newTrainee]);
    setCurrentUser(newTrainee);
    triggerMakeWebhook(settings.makeWebhookUrl, 'new_trainee_registered', newTrainee);
  };

  const handleWorkoutRegister = (workoutId) => {
    if (!currentUser) return;

    const workout = workouts.find(w => w.id === workoutId);
    const existingReg = registrations.find(r => r.workout_id === workoutId && r.user_id === currentUser.id);

    if (existingReg) {
      alert('כבר נרשמת לאימון זה!');
      return;
    }

    const currentRegsCount = registrations.filter(r => r.workout_id === workoutId).length;

    if (currentRegsCount >= workout.max_participants) {
      const confirmWaitlist = window.confirm('האימון מלא! האם ברצונך להירשם לרשימת ההמתנה? נעדכן אותך בוואטסאפ אם יתפנה מקום.');
      if (confirmWaitlist) {
        const newWaitEntry = {
          id: 'w_' + Date.now(),
          workout_id: workoutId,
          user_id: currentUser.id,
          created_at: new Date().toISOString()
        };
        setWaitlist(prev => [...prev, newWaitEntry]);
        alert('נרשמת בהצלחה לרשימת ההמתנה!');
        triggerMakeWebhook(settings.makeWebhookUrl, 'waitlist_joined', { workout, user: currentUser });
      }
      return;
    }

    const newReg = {
      id: 'r_' + Date.now(),
      workout_id: workoutId,
      user_id: currentUser.id,
      payment_status: 'unpaid',
      created_at: new Date().toISOString()
    };

    setRegistrations(prev => [...prev, newReg]);
    alert(`נרשמת בהצלחה לאימון ${workout.type}!`);
    triggerMakeWebhook(settings.makeWebhookUrl, 'workout_registered', { workout, user: currentUser });
  };

  // ביטול אימון (חוק 12 השעות) + הודעת וואטסאפ אוטומטית לתהל
  const handleCancelRegistration = (workoutId) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const workoutDateTime = new Date(`${workout.date}T${workout.time}`);
    const now = new Date();
    const diffInHours = (workoutDateTime - now) / (1000 * 60 * 60);

    if (diffInHours < 12) {
      alert('⚠️ לפי מדיניות הביטולים, ניתן לבטל הרשמה עצמאית עד 12 שעות לפני תחילת האימון. כעת נותרו פחות מ-12 שעות, ולכן הביטול לא ניתן לביצוע אוטומטי. אנא פני לתהל בפרטי.');
      return;
    }

    if (window.confirm(`האם לבטל את הרשמתך לאימון ${workout.type}?`)) {
      setRegistrations(prev => prev.filter(r => !(r.workout_id === workoutId && r.user_id === currentUser.id)));
      alert('ההרשמה בוטלה בהצלחה. כעת ייפתח חלון וואטסאפ לשליחת הודעת עדכון לתהל.');

      // הודעת וואטסאפ חובה לתהל על הביטול
      const msg = `היי תהל! 👋 ביטלתי את הרשמתי לאימון ${workout.type} בתאריך ${workout.date} בשעה ${workout.time}. (שם: ${currentUser.full_name})`;
      openWhatsApp('0501234567', msg);
    }
  };

  // ביטול רשימת המתנה
  const handleCancelWaitlist = (workoutId) => {
    if (window.confirm('האם להסיר את עצמך מרשימת ההמתנה?')) {
      setWaitlist(prev => prev.filter(w => !(w.workout_id === workoutId && w.user_id === currentUser.id)));
      alert('הוסרת מרשימת ההמתנה.');
    }
  };

  if (!isRegistered) {
    return (
      <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-gray-900">הרשמה והצהרת בריאות</h2>
          <p className="text-xs text-gray-500 mt-1">
            ברוכים הבאים לתהל פיטנס! מילוי הצהרת הבריאות הינו חובה לפני הרשמה לאימונים.
          </p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">שם מלא *</label>
            <input 
              required
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="ישראל ישראלי"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">מספר טלפון *</label>
              <input 
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="0501234567"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">אימייל *</label>
              <input 
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
            <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
              <FileText size={16} /> הצהרת בריאות דיגיטלית
            </h4>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="medical_cond"
                checked={formData.has_medical_condition}
                onChange={(e) => setFormData({...formData, has_medical_condition: e.target.checked})}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <label htmlFor="medical_cond" className="text-xs text-gray-800 font-medium">
                האם קיימת מגבלה רפואית / מחלה / רגישות הידועה לך?
              </label>
            </div>

            {formData.has_medical_condition && (
              <textarea 
                value={formData.medical_notes}
                onChange={(e) => setFormData({...formData, medical_notes: e.target.value})}
                placeholder="פרטי בקצרה את המגבלה הרפואית..."
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs outline-none"
                rows={2}
              />
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">חתימה דיגיטלית (חובה) *</label>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden touch-none">
                <SignatureCanvas 
                  ref={sigCanvasRef}
                  penColor="#1f2937"
                  canvasProps={{ className: 'w-full h-28 cursor-crosshair' }}
                />
              </div>
              <button 
                type="button" 
                onClick={() => sigCanvasRef.current?.clear()}
                className="text-[11px] text-gray-500 hover:text-red-500 mt-1 font-semibold flex items-center gap-1"
              >
                <RefreshCw size={12} /> נקי חתימה
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input 
              required
              type="checkbox"
              id="terms"
              checked={formData.terms_accepted}
              onChange={(e) => setFormData({...formData, terms_accepted: e.target.checked})}
              className="w-4 h-4 text-amber-600 rounded mt-0.5"
            />
            <label htmlFor="terms" className="text-xs text-gray-600 leading-tight">
              אני מצהירה כי הפרטים שנמסרו נכונים, ואני מסכימה לתקנון הסטודיו ומדיניות הביטולים (ביטול עצמאי עד 12 שעות לפני האימון).
            </label>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-gray-900 to-amber-900 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:opacity-95 transition text-sm"
          >
            שליחה והרשמה לאתר
          </button>
        </form>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-xl text-center border border-amber-100">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Clock size={36} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">תודה שנרשמת!</h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
          הפרטים והצהרת הבריאות שלך התקבלו בהצלחה. <br />
          החשבון שלך נמצא כעת בסטטוס <span className="font-bold text-amber-700">"ממתין לאישור"</span>. תהל תאשר אותך בהקדם ותקבלי הודעת וואטסאפ כשתסיימי!
        </p>

        <button 
          onClick={() => openWhatsApp('0501234567', `היי תהל, נרשמתי באתר בשם ${currentUser.full_name}, אשמח שתאשרי אותי!`)}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm transition shadow-md"
        >
          <MessageCircle size={18} />
          <span>שלחי תזכורת לתהל בוואטסאפ</span>
        </button>
      </div>
    );
  }

  const now = new Date();
  const upcomingWorkouts = workouts
    .filter(w => new Date(`${w.date}T${w.time}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

 const myRegistrations = (registrations || []).filter(r => r?.user_id === currentUser?.id);
  const myRegisteredWorkoutIds = myRegistrations.map(r => r.workout_id);

  const myWaitlistEntries = (waitlist || []).filter(w => w?.user_id === currentUser?.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex bg-white/80 p-1.5 rounded-2xl shadow-sm border border-gray-200/80">
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'schedule' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar size={16} />
          <span>לוח אימונים שבועי</span>
        </button>
        <button 
          onClick={() => setActiveTab('my_workouts')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'my_workouts' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award size={16} />
          <span>האימונים שלי ({myRegisteredWorkoutIds.length})</span>
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <span>אימונים קרובים</span>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
              {upcomingWorkouts.length} זמינים
            </span>
          </h3>

          {upcomingWorkouts.length === 0 ? (
            <div className="bg-white/90 p-8 rounded-3xl text-center text-gray-500">
              אין אימונים עתידיים במערכת כרגע. בדקי שוב מאוחר יותר!
            </div>
          ) : (
            upcomingWorkouts.map(workout => {
              const registeredCount = registrations.filter(r => r.workout_id === workout.id).length;
              const isFull = registeredCount >= workout.max_participants;
              const isUserRegistered = myRegisteredWorkoutIds.includes(workout.id);
              const isUserInWaitlist = waitlist.some(w => w.workout_id === workout.id && w.user_id === currentUser.id);

              return (
                <div 
                  key={workout.id}
                  className={`bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-lg border transition duration-200 ${
                    isUserRegistered ? 'border-emerald-400 bg-emerald-50/20' : 'border-gray-100 hover:border-amber-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-gray-900">{workout.type}</span>
                        {isUserRegistered && (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Check size={12} /> רשומה לאימון
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 font-medium">
                        <span className="flex items-center gap-1 text-amber-800 font-bold">
                          <Calendar size={14} /> {workout.date} בשעה {workout.time}
                        </span>
                        <span>• {workout.location}</span>
                        <span className="font-bold text-gray-900">מחיר: {workout.price} ₪</span>
                      </div>

                      {workout.notes && (
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-xl mt-2 italic">
                          💡 {workout.notes}
                        </p>
                      )}

                      <div className="pt-1 flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {registeredCount} / {workout.max_participants} משתתפים
                        </span>
                        {isFull && (
                          <span className="text-[11px] text-amber-700 font-semibold">
                            (אימון מלא - {workoutWaitlist.length} בהמתנה)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUserRegistered ? (
                        <button 
                          onClick={() => handleCancelRegistration(workout.id)}
                          className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2.5 rounded-2xl border border-red-200 transition"
                        >
                          ביטול הרשמה
                        </button>
                      ) : isFull ? (
                        <button 
                          onClick={() => handleWorkoutRegister(workout.id)}
                          disabled={isUserInWaitlist}
                          className={`w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-2xl transition ${
                            isUserInWaitlist 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                          }`}
                        >
                          {isUserInWaitlist ? 'ברשימת המתנה' : 'הרשמה להמתנה'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleWorkoutRegister(workout.id)}
                          className="w-full sm:w-auto bg-gray-900 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md transition"
                        >
                          הרשמי לאימון
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'my_workouts' && (
        <div className="space-y-6">
          
          {/* אימונים מאושרים */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-gray-900 text-base">אימונים שאליהם הרשמתי</h3>
            {myRegistrations.length === 0 ? (
              <p className="text-xs text-gray-500 bg-white/80 p-4 rounded-2xl">עדיין לא נרשמת לאף אימון. כנסי ללוח האימונים והרשמי!</p>
            ) : (
              myRegistrations.map(reg => {
                const workout = workouts.find(w => w.id === reg.workout_id);
                if (!workout) return null;

                return (
                  <div key={reg.id} className="bg-white/95 p-5 rounded-3xl shadow-md border border-gray-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">{workout.type}</h4>
                      <p className="text-xs text-gray-500">{workout.date} | {workout.time} | {workout.location}</p>
                      <p className="text-xs font-bold text-amber-800 mt-1">מחיר: {workout.price} ₪</p>
                    </div>
                    
                    <div className="text-left">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        reg.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        reg.payment_status === 'punch_card' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {reg.payment_status === 'paid' ? 'שולם' : reg.payment_status === 'punch_card' ? 'כרטיסייה' : 'טרם שולם'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* אימונים ברשימת המתנה */}
          {myWaitlistEntries.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-extrabold text-amber-900 text-base flex items-center gap-2">
                <ListOrdered size={18} /> אימונים שאני ברשימת ההמתנה שלהם
              </h3>
              
              {myWaitlistEntries.map(entry => {
                const workout = workouts.find(w => w.id === entry.workout_id);
                if (!workout) return null;

                const workoutWaitlist = waitlist
                  .filter(w => w.workout_id === workout.id)
                  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                
                const spot = workoutWaitlist.findIndex(w => w.user_id === currentUser.id) + 1;

                return (
                  <div key={entry.id} className="bg-amber-50/80 p-5 rounded-3xl shadow-sm border border-amber-200 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{workout.type}</h4>
                        <span className="bg-amber-200 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                          מקום {spot} בתור
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{workout.date} בשעה {workout.time} | {workout.location}</p>
                    </div>

                    <button 
                      onClick={() => handleCancelWaitlist(workout.id)}
                      className="bg-white hover:bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-xl border border-red-200"
                    >
                      ביטול המתנה
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

// ============================================================================
// 7. פאנל ניהול מנהלת (ADMIN DASHBOARD - TAHAL)
// ============================================================================
const AdminDashboard = ({ 
  workouts = [], setWorkouts, 
  trainees = [], setTrainees, 
  registrations = [], setRegistrations, 
  waitlist = [], setWaitlist,
  settings, setSettings 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [newWorkout, setNewWorkout] = useState({
    type: 'אימון כוח וחיטוב',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    location: 'סטודיו מרכזי, הוד השרון',
    price: 70,
    max_participants: 10,
    notes: ''
  });

  const [broadcastModalWorkout, setBroadcastModalWorkout] = useState(null);
  const [broadcastText, setBroadcastText] = useState('היי בנות! תזכורת לאימון שלנו היום בסטודיו. נא להגיע 5 דקות לפני עם מגבת ומים!');
  const [sentBroadcastUserIds, setSentBroadcastUserIds] = useState([]);
  const [financeMonth, setFinanceMonth] = useState('2026-08');
  
  // משתנה זמני לשמירת הגדרות האתר לפני שמירה סופית
  const [tempSettings, setTempSettings] = useState(settings);
  useEffect(() => { setTempSettings(settings); }, [settings]);

  const stats = useMemo(() => {
    const totalTraineesCount = trainees.length;
    const pendingTraineesCount = trainees.filter(t => !t.is_approved).length;
    
    let totalRevenue = 0;
    let unpaidAmount = 0;
    const unpaidDebtsList = [];

    registrations.forEach(reg => {
      const w = workouts.find(item => item.id === reg.workout_id);
      const user = trainees.find(u => u.id === reg.user_id);
      if (!w || !user) return;

      if (reg.payment_status === 'paid') {
        totalRevenue += Number(w.price || 0);
      } else if (reg.payment_status === 'unpaid') {
        unpaidAmount += Number(w.price || 0);
        const workoutDateTime = new Date(`${w.date}T${w.time}`);
        if (workoutDateTime < new Date()) {
          unpaidDebtsList.push({ regId: reg.id, user, workout: w, amount: w.price });
        }
      }
    });

    const totalCapacity = workouts.reduce((acc, w) => acc + Number(w.max_participants || 0), 0);
    const totalBooked = registrations.length;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    return {
      totalTraineesCount,
      pendingTraineesCount,
      totalRevenue,
      unpaidAmount,
      unpaidDebtsList,
      occupancyRate
    };
  }, [trainees, workouts, registrations]);

  const handleAddWorkoutSubmit = (e) => {
    e.preventDefault();
    if (!newWorkout.price || newWorkout.price <= 0) {
      alert('מחיר האימון הינו שדה חובה!');
      return;
    }

    const created = {
      id: 'w_' + Date.now(),
      ...newWorkout,
      price: Number(newWorkout.price),
      max_participants: Number(newWorkout.max_participants),
      created_at: new Date().toISOString()
    };

    setWorkouts(prev => [created, ...prev]);
    alert('האימון נוסף בהצלחה!');
    setNewWorkout({
      type: 'אימון כוח וחיטוב',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      location: 'סטודיו מרכזי, הוד השרון',
      price: 70,
      max_participants: 10,
      notes: ''
    });
  };

  const handleDeleteWorkout = (id) => {
    if (window.confirm('האם למחוק אימון זה? כל הרשמות המתאמנים יוסרו.')) {
      setWorkouts(prev => prev.filter(w => w.id !== id));
      setRegistrations(prev => prev.filter(r => r.workout_id !== id));
    }
  };

  const handleApproveTrainee = (trainee) => {
    setTrainees(prev => prev.map(t => t.id === trainee.id ? { ...t, is_approved: true } : t));
    const currentSiteUrl = window.location.origin;
    const msg = `היי ${trainee.full_name}! 👋 אושרת בהצלחה באתר שלי! אפשר עכשיו להירשם לאימונים כאן: ${currentSiteUrl}`;
    openWhatsApp(trainee.phone, msg);
  };

  const handleRejectTrainee = (traineeId) => {
    if (window.confirm('האם לדחות את המתאמן/ת?')) {
      setTrainees(prev => prev.filter(t => t.id !== traineeId));
    }
  };

  const handleDeleteTrainee = (traineeId, traineeName) => {
    if (window.confirm(`האם את בטוחה שברצונך למחוק את ${traineeName} מהמערכת? מחיקה זו תבטל גם את כל ההרשמות שלה לאימונים.`)) {
      if (window.confirm('⚠️ אזהרה אחרונה! פעולה זו לא ניתנת לביטול. למחוק לצמיתות?')) {
        setTrainees(prev => prev.filter(t => t.id !== traineeId));
        setRegistrations(prev => prev.filter(r => r.user_id !== traineeId));
        setWaitlist(prev => prev.filter(w => w.user_id !== traineeId));
        alert('המתאמנת נמחקה מהמערכת בהצלחה.');
      }
    }
  };

  // תהל שולחת הצעת מקום מהמתנה בוואטסאפ (אפשרות לכל מתאמנת בהמתנה!)
  const handleSendWaitlistOfferWhatsApp = (trainee, workout) => {
    const siteUrl = window.location.origin;
    const msg = `היי ${trainee.full_name}! 👋 התפנה מקום לאימון ${workout.type} בתאריך ${workout.date} בשעה ${workout.time}. אם תרצי להירשם, כנסי לאתר: ${siteUrl}`;
    openWhatsApp(trainee.phone, msg);
  };

  // תהל מעבירה מתאמנת מרשימת ההמתנה ישירות לרשימת המשתתפים באימון
  const handlePromoteFromWaitlist = (waitEntry, trainee, workout) => {
    // 1. הסרה מרשימת המתנה
    setWaitlist(prev => prev.filter(w => w.id !== waitEntry.id));

    // 2. הוספה להרשמות לאימון
    const newReg = {
      id: 'r_' + Date.now(),
      workout_id: workout.id,
      user_id: trainee.id,
      payment_status: 'unpaid',
      created_at: new Date().toISOString()
    };
    setRegistrations(prev => [...prev, newReg]);

    alert(`${trainee.full_name} הועברה בהצלחה מרשימת ההמתנה לאימון! כעת ייפתח חלון וואטסאפ לעדכונה.`);

    // 3. שליחת הודעת וואטסאפ מאשרת
    const msg = `היי ${trainee.full_name}! 👋 שמחה לעדכן אותך שנרשמת בהצלחה לאימון ${workout.type} בתאריך ${workout.date} בשעה ${workout.time}! נתראה!`;
    openWhatsApp(trainee.phone, msg);
  };

  const handleUpdatePaymentStatus = (regId, newStatus) => {
    setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, payment_status: newStatus } : r));
  };

  const handleImageUpload = async (e, targetKey) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadToCloudinary(file, settings.cloudinaryCloudName, settings.cloudinaryPreset);
      setTempSettings(prev => ({ ...prev, [targetKey]: url }));
      alert('התמונה עלתה בהצלחה! לחצי על "שמירת הגדרות" בתחתית העמוד כדי להחיל אותה.');
    } catch (err) {
      alert('שגיאה בהעלאת התמונה');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white/95 backdrop-blur-md p-2 rounded-3xl shadow-lg border border-gray-100 flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'סיכום דשבורד', icon: Award },
          { id: 'workouts', label: 'ניהול אימונים', icon: Calendar },
          { id: 'trainees', label: `מתאמנים (${stats.pendingTraineesCount ? `! ${stats.pendingTraineesCount}` : trainees.length})`, icon: Users },
          { id: 'finance', label: `כספים ורו"ח ${stats.unpaidDebtsList.length ? '⚠️' : ''}`, icon: CreditCard },
          { id: 'settings', label: 'הגדרות ומיתוג', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                isActive ? 'bg-gradient-to-r from-gray-900 to-amber-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/90 p-5 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-bold">סה"כ מתאמנים</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.totalTraineesCount}</h3>
              {stats.pendingTraineesCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                  {stats.pendingTraineesCount} ממתינים לאישור
                </span>
              )}
            </div>

            <div className="bg-white/90 p-5 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-bold">הכנסות ששולמו</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.totalRevenue} ₪</h3>
            </div>

            <div className="bg-white/90 p-5 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-bold">תשלומים ממתינים / חוב</p>
              <h3 className="text-2xl font-black text-red-500 mt-1">{stats.unpaidAmount} ₪</h3>
            </div>

            <div className="bg-white/90 p-5 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-bold">תפוסת אימונים ממוצעת</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.occupancyRate}%</h3>
            </div>
          </div>

          {stats.unpaidDebtsList.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl shadow-md">
              <div className="flex items-center gap-2 text-red-800 font-black mb-3">
                <AlertCircle size={20} />
                <h4>התראות חוב מאימונים שעברו ({stats.unpaidDebtsList.length})</h4>
              </div>
              
              <div className="space-y-2">
                {stats.unpaidDebtsList.map((debt, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs border border-red-100">
                    <div>
                      <span className="font-bold text-gray-900">{debt.user.full_name}</span>
                      <span className="text-gray-500"> ({debt.user.phone}) - </span>
                      <span className="font-semibold text-gray-700">{debt.workout.type} ב-{debt.workout.date}</span>
                      <span className="font-black text-red-600 ml-2">[{debt.amount} ₪]</span>
                    </div>

                    <button 
                      onClick={() => {
                        const msg = `היי ${debt.user.full_name}! 👋 ראיתי שטרם הסדרת תשלום על אימון ${debt.workout.type} בתאריך ${debt.workout.date} בסך ${debt.amount} ש"ח. אשמח להסדרה :)`;
                        openWhatsApp(debt.user.phone, msg);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 text-[11px] self-start sm:self-auto"
                    >
                      <MessageCircle size={14} /> שלחי תזכורת בוואטסאפ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="space-y-6">
          <div className="bg-white/95 p-6 rounded-3xl shadow-md border border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
              <Plus size={18} className="text-amber-600" /> הוספת אימון שבועי חדש
            </h3>

            <form onSubmit={handleAddWorkoutSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">סוג האימון *</label>
                <input 
                  required
                  type="text"
                  value={newWorkout.type}
                  onChange={(e) => setNewWorkout({...newWorkout, type: e.target.value})}
                  placeholder="אימון כוח / פילאטיס / HIIT"
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">תאריך *</label>
                <input 
                  required
                  type="date"
                  value={newWorkout.date}
                  onChange={(e) => setNewWorkout({...newWorkout, date: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">שעה *</label>
                <input 
                  required
                  type="time"
                  value={newWorkout.time}
                  onChange={(e) => setNewWorkout({...newWorkout, time: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">מיקום *</label>
                <input 
                  required
                  type="text"
                  value={newWorkout.location}
                  onChange={(e) => setNewWorkout({...newWorkout, location: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-800 mb-1">מחיר האימון (₪) - שדה חובה! *</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={newWorkout.price}
                  onChange={(e) => setNewWorkout({...newWorkout, price: e.target.value})}
                  placeholder="70"
                  className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold text-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">מקסימום משתתפים *</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={newWorkout.max_participants}
                  onChange={(e) => setNewWorkout({...newWorkout, max_participants: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-bold text-gray-700 mb-1">הערות לאימון</label>
                <input 
                  type="text"
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({...newWorkout, notes: e.target.value})}
                  placeholder="ציוד נדרש, מיקוד האימון..."
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3 pt-2">
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-900 to-amber-900 text-white font-bold py-3 rounded-xl hover:opacity-95 shadow-md"
                >
                  צור אימון חדש
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-sm">אימונים במערכת ({workouts.length})</h4>
            
            {workouts.map(workout => {
              const regList = registrations.filter(r => r.workout_id === workout.id);
              const isPast = new Date(`${workout.date}T${workout.time}`) < new Date();
              
              // הוספת משתנה רשימת ההמתנה שפותר את הקריסה!
              const workoutWaitlist = waitlist
                .filter(w => w.workout_id === workout.id)
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

              return (
                <div key={workout.id} className={`bg-white/95 p-5 rounded-3xl shadow-sm border ${isPast ? 'opacity-75 bg-gray-50' : 'border-gray-100'}`}>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-gray-900">{workout.type}</span>
                        {isPast && <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-bold">היסטוריה (ארכיון)</span>}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {workout.date} בשעה {workout.time} | {workout.location} | <span className="font-bold text-amber-800">{workout.price} ₪</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">
                        משתתפים: {regList.length} / {workout.max_participants}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setBroadcastModalWorkout(workout);
                          setSentBroadcastUserIds([]);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <MessageCircle size={15} /> תפוצה למשתתפים (Broadcast)
                      </button>

                      <button 
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                        title="מחק אימון"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {regList.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 mb-2">רשימת משתתפים לאימון זה:</p>
                      <div className="flex flex-wrap gap-2">
                        {regList.map(r => {
                          const user = trainees.find(t => t.id === r.user_id);
                          return (
                            <span key={r.id} className="bg-gray-100 text-gray-800 text-[11px] px-2.5 py-1 rounded-xl font-medium flex items-center gap-1">
                              {user ? user.full_name : 'מתאמן'}
                              <span className={`w-2 h-2 rounded-full ${r.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* ניהול רשימת המתנה (WAITLIST) עבור תהל */}
                  {workoutWaitlist.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-amber-200 bg-amber-50/50 p-3 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-amber-900 flex items-center gap-1">
                          <ListOrdered size={14} /> רשימת המתנה ({workoutWaitlist.length} ממתינות)
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold">ניתן לשלוח הודעה לכל מתאמנת בתור</span>
                      </div>

                      <div className="space-y-2">
                        {workoutWaitlist.map((waitEntry, idx) => {
                          const trainee = trainees.find(t => t.id === waitEntry.user_id);
                          if (!trainee) return null;

                          return (
                            <div key={waitEntry.id} className="bg-white p-2.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="font-bold text-gray-900">{trainee.full_name}</span>
                                  <span className="text-gray-500 text-[11px] ml-1">({trainee.phone})</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button 
                                  onClick={() => handleSendWaitlistOfferWhatsApp(trainee, workout)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                                  title="שלחי הצעת מקום בוואטסאפ"
                                >
                                  <MessageCircle size={13} /> שלחי הצעת מקום
                                </button>

                                <button 
                                  onClick={() => handlePromoteFromWaitlist(waitEntry, trainee, workout)}
                                  className="bg-gray-900 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1"
                                  title="רשמי אותה לאימון כעת"
                                >
                                  <Check size={13} /> העברי לאימון
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'trainees' && (
        <div className="space-y-6">
          <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-3xl space-y-3">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Clock size={18} className="text-amber-600" /> מתאמנים חדשים שממתינים לאישור ({trainees.filter(t => !t.is_approved).length})
            </h3>

            {trainees.filter(t => !t.is_approved).length === 0 ? (
              <p className="text-xs text-gray-500">אין מתאמנים שממתינים לאישור כרגע.</p>
            ) : (
              trainees.filter(t => !t.is_approved).map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{t.full_name}</h4>
                    <p className="text-xs text-gray-500">{t.phone} | {t.email}</p>
                    {t.health_declaration?.has_medical_condition && (
                      <p className="text-xs text-red-600 font-semibold mt-1">⚠️ מגבלה: {t.health_declaration.medical_notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleApproveTrainee(t)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-md"
                    >
                      <Check size={16} /> אישור + הודעת וואטסאפ
                    </button>
                    <button 
                      onClick={() => handleRejectTrainee(t.id)}
                      className="bg-red-100 text-red-600 hover:bg-red-200 text-xs font-bold px-3 py-2 rounded-xl"
                    >
                      דחיות
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">מתאמנים פעילים ({trainees.filter(t => t.is_approved).length})</h3>

            <div className="grid grid-cols-1 gap-6">
              {trainees.filter(t => t.is_approved).map(t => (
                <div key={t.id} className="bg-white/95 p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  
                  {/* תוכן שמיועד גם ל-PDF - אנחנו עוטפים אותו ב-div נפרד */}
                  <div id={`hd_doc_${t.id}`} className="p-4 bg-white space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <h2 className="font-black text-lg text-gray-900">הצהרת בריאות ופרטי מתאמנת</h2>
                        <h4 className="font-bold text-base text-gray-800 mt-1">{t.full_name}</h4>
                      </div>
                      <img src={settings.logoUrl || ''} alt="לוגו" className="h-10 object-contain hidden print:block" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <p><strong>טלפון:</strong> {t.phone}</p>
                      <p><strong>אימייל:</strong> {t.email}</p>
                      <p><strong>תאריך הצטרפות:</strong> {new Date(t.created_at).toLocaleDateString('he-IL')}</p>
                    </div>

                    {t.health_declaration && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm space-y-2 mt-2">
                        <h3 className="font-bold text-amber-900 border-b pb-1">שאלון רפואי</h3>
                        <p><strong>האם קיימת מגבלה רפואית / מחלה / רגישות?</strong> {t.health_declaration.has_medical_condition ? 'כן' : 'לא'}</p>
                        {t.health_declaration.has_medical_condition && (
                          <p className="text-red-600"><strong>פירוט המגבלה:</strong> {t.health_declaration.medical_notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">אני מצהירה כי הפרטים שנמסרו נכונים, ואני מסכימה לתקנון הסטודיו ומדיניות הביטולים.</p>
                        
                        {t.health_declaration.signature_url && (
                          <div className="pt-4 mt-2 border-t border-gray-200">
                            <p className="font-bold mb-1">חתימת המתאמנת (נחתם ב-{t.health_declaration.signed_at}):</p>
                            <img src={t.health_declaration.signature_url} alt="חתימה" className="h-12 object-contain border bg-white p-1 rounded" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* כפתורי פעולה (לא יופיעו ב-PDF כי הם מחוץ ל-div של ה-PDF) */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => openWhatsApp(t.phone, `היי ${t.full_name}, תהל כאן!`)}
                      className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold py-2 rounded-xl flex justify-center items-center gap-1"
                    >
                      <MessageCircle size={14} /> הודעה
                    </button>
                    <button 
                      onClick={() => exportToPdf(`hd_doc_${t.id}`, `הצהרת_בריאות_${t.full_name}.pdf`)}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                      title="הורד הצהרת בריאות כ-PDF"
                    >
                      <Download size={14} /> PDF
                    </button>
                    <button 
                      onClick={() => handleDeleteTrainee(t.id, t.full_name)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                      title="מחק מתאמנת לצמיתות"
                    >
                      <Trash2 size={14} /> מחיקה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">דוח הכנסות ורואה חשבון</h3>
              <p className="text-xs text-gray-500">ניהול סטטוס תשלומים והפקת דוחות PDF לרו"ח</p>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="month"
                value={financeMonth}
                onChange={(e) => setFinanceMonth(e.target.value)}
                className="p-2 border rounded-xl text-xs font-bold outline-none"
              />
              <button 
                onClick={() => exportToPdf('accounting-report-table', `דוח_הכנסות_${financeMonth}.pdf`)}
                className="bg-gradient-to-r from-gray-900 to-amber-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <Download size={16} /> ייצוא דוח לרו"ח (PDF)
              </button>
            </div>
          </div>

          <div id="accounting-report-table" className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-black text-gray-900 text-sm">פירוט תשלומים לחודש {financeMonth}</h4>
              <p className="text-xs font-bold text-emerald-600">סה"כ נגבה: {stats.totalRevenue} ₪</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b">
                    <th className="p-3">שם המתאמנ/ת</th>
                    <th className="p-3">אימון</th>
                    <th className="p-3">תאריך</th>
                    <th className="p-3">סכום</th>
                    <th className="p-3">סטטוס תשלום</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {registrations.map(reg => {
                    const workout = workouts.find(w => w.id === reg.workout_id);
                    const trainee = trainees.find(t => t.id === reg.user_id);
                    if (!workout || !trainee) return null;

                    return (
                      <tr key={reg.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-gray-900">{trainee.full_name}</td>
                        <td className="p-3">{workout.type}</td>
                        <td className="p-3">{workout.date}</td>
                        <td className="p-3 font-extrabold text-gray-900">{workout.price} ₪</td>
                        <td className="p-3">
                          <select 
                            value={reg.payment_status}
                            onChange={(e) => handleUpdatePaymentStatus(reg.id, e.target.value)}
                            className={`p-1.5 rounded-xl font-bold text-xs outline-none cursor-pointer ${
                              reg.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              reg.payment_status === 'punch_card' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <option value="paid">שולם</option>
                            <option value="unpaid">לא שולם</option>
                            <option value="punch_card">כרטיסייה</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

     {activeTab === 'settings' && (
        <div className="bg-white/95 p-6 rounded-3xl shadow-md border border-gray-100 space-y-6">
          <h3 className="font-extrabold text-gray-900 text-base border-b pb-3">הגדרות מערכת, מיתוג וסיסמאות</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <h4 className="font-bold text-xs text-gray-800">לוגו העסק (תצוגה מקדימה)</h4>
              {tempSettings.logoUrl && (
                <div className="bg-white p-2 rounded-xl border inline-block">
                  <img src={tempSettings.logoUrl} alt="לוגו נוכחי" className="h-16 object-contain" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'logoUrl')}
                className="text-xs text-gray-500 block w-full bg-white p-2 border rounded-lg"
              />
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <h4 className="font-bold text-xs text-gray-800">תמונת רקע לאתר (תצוגה מקדימה)</h4>
              {tempSettings.backgroundUrl && (
                <div className="h-20 w-full rounded-xl border bg-cover bg-center" style={{ backgroundImage: `url(${tempSettings.backgroundUrl})` }}></div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'backgroundUrl')}
                className="text-xs text-gray-500 block w-full bg-white p-2 border rounded-lg"
              />
            </div>

            <div className="space-y-2 sm:col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700">סיסמת כניסה למנהלת (לתפריט הנסתר)</label>
              <input 
                type="text"
                value={tempSettings.adminPassword}
                onChange={(e) => setTempSettings({...tempSettings, adminPassword: e.target.value})}
                className="w-full sm:w-1/2 p-3 bg-white border border-gray-300 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            
            <div className="sm:col-span-2 pt-2">
              <button 
                onClick={() => {
                  setSettings(tempSettings);
                  alert('כל ההגדרות נשמרו בהצלחה!');
                }}
                className="w-full bg-gradient-to-r from-gray-900 to-amber-900 text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <Check size={20} /> שמירת כל ההגדרות
              </button>
            </div>
          </div>
        </div>
      )}

      {broadcastModalWorkout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">
                שליחת הודעת תפוצה לאימון {broadcastModalWorkout.type}
              </h3>
              <button onClick={() => setBroadcastModalWorkout(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">נוסח ההודעה:</label>
              <textarea 
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs outline-none"
                rows={3}
              />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">נרשמי האימון - לחצי לשליחה אחד-אחד:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {registrations
                  .filter(r => r.workout_id === broadcastModalWorkout.id)
                  .map(r => {
                    const user = trainees.find(t => t.id === r.user_id);
                    if (!user) return null;

                    const isSent = sentBroadcastUserIds.includes(user.id);

                    return (
                      <div key={user.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs">
                        <span className="font-bold text-gray-800">{user.full_name} ({user.phone})</span>

                        <button 
                          onClick={() => {
                            openWhatsApp(user.phone, broadcastText);
                            if (!isSent) {
                              setSentBroadcastUserIds(prev => [...prev, user.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition ${
                            isSent ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                          }`}
                        >
                          {isSent ? <CheckCircle2 size={14} /> : <MessageCircle size={14} />}
                          <span>{isSent ? 'נשלח ✓' : 'שלחי בוואטסאפ'}</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            <button 
              onClick={() => setBroadcastModalWorkout(null)}
              className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2"
            >
              סגרי חלון
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// ============================================================================
// 8. רכיב האפליקציה הראשי (APP COMPONENT - SUPABASE GLOBAL SYNC)
// ============================================================================
export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [workouts, setWorkouts] = useState(INITIAL_WORKOUTS);
  const [trainees, setTrainees] = useState(INITIAL_TRAINEES);
  const [registrations, setRegistrations] = useState(INITIAL_REGISTRATIONS);
  const [waitlist, setWaitlist] = useState(INITIAL_WAITLIST);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  
  // מתאמן חדש יתחיל כ-null (יצטרך להירשם), אבל האתר יזכור אותו לפי המכשיר שלו
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('tahel_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tahel_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('tahel_current_user');
    }
  }, [currentUser]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // עדכון כותרת הדפדפן והלוגו הקטן בלשונית (Favicon)
  useEffect(() => {
    document.title = "תהל בן משה - מאמנת כושר";
    if (settings.logoUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logoUrl;
    }
  }, [settings.logoUrl]);

  // טעינת הנתונים מ-Supabase בפתיחת האתר (סנכרון גלובלי)
  useEffect(() => {
    const loadGlobalState = async () => {
      try {
        const { data, error } = await supabase.from('global_app_state').select('state_data').eq('id', 1).single();
        if (data && data.state_data && Object.keys(data.state_data).length > 0) {
          setSettings(data.state_data.settings || DEFAULT_SETTINGS);
          setWorkouts(data.state_data.workouts || INITIAL_WORKOUTS);
          setTrainees(data.state_data.trainees || INITIAL_TRAINEES);
          setRegistrations(data.state_data.registrations || INITIAL_REGISTRATIONS);
          setWaitlist(data.state_data.waitlist || INITIAL_WAITLIST);
        }
      } catch (err) {
        console.error("Error loading from Supabase:", err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadGlobalState();
  }, []);

  // שמירת הנתונים ל-Supabase אוטומטית בכל שינוי
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const saveGlobalState = async () => {
      const stateToSave = { settings, workouts, trainees, registrations, waitlist };
      await supabase.from('global_app_state').upsert({ id: 1, state_data: stateToSave });
    };
    
    saveGlobalState();
  }, [settings, workouts, trainees, registrations, waitlist, isDataLoaded]);

  return (
    <Router>
      <div dir="rtl" className="font-sans text-gray-900 antialiased selection:bg-amber-200 relative min-h-screen">
        
        {/* רקע מקובע שתופס את כל המסך גם במובייל וגם בגלילה */}
        <div 
          className="fixed inset-0 z-[-1] bg-cover bg-center" 
          style={{ backgroundImage: `url(${settings.backgroundUrl})` }}
        ></div>
        
        <div className="min-h-screen bg-gradient-to-b from-white/80 via-white/70 to-white/85 backdrop-blur-[3px] pb-12 relative z-10">
          
          <MainHeader 
            settings={settings}
            isAdmin={isAdminLoggedIn}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onLogout={() => setIsAdminLoggedIn(false)}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            setTrainees={setTrainees}
          />

          <main className="px-4">
            {isAdminLoggedIn ? (
              <AdminDashboard 
                workouts={workouts}
                setWorkouts={setWorkouts}
                trainees={trainees}
                setTrainees={setTrainees}
                registrations={registrations}
                setRegistrations={setRegistrations}
                settings={settings}
                setSettings={setSettings}
              />
            ) : (
              <UserView 
                trainees={trainees}
                setTrainees={setTrainees}
                workouts={workouts}
                registrations={registrations}
                setRegistrations={setRegistrations}
                waitlist={waitlist}
                setWaitlist={setWaitlist}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                settings={settings}
              />
            )}
          </main>

          <AdminLoginModal 
            isOpen={isAdminLoginModalOpen}
            onClose={() => setIsAdminLoginModalOpen(false)}
            onLogin={() => setIsAdminLoggedIn(true)}
            currentPassword={settings.adminPassword}
          />

        </div>
      </div>
    </Router>
  );
}