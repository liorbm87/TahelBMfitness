import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import SignatureCanvas from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import { 
  Calendar, Users, Settings, LogOut, Check, X, CreditCard, MessageCircle, 
  Download, Upload, Plus, Trash2, AlertCircle, CheckCircle2, Clock, 
  DollarSign, Edit, Search, Send, FileText, ChevronRight, Filter, Eye, 
  Lock, RefreshCw, Award, ChevronDown, CheckSquare, Square, Phone, ShieldAlert, Archive, UserPlus, LogIn, ListOrdered
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

const INITIAL_WORKOUTS = [];
const INITIAL_TRAINEES = [];
const INITIAL_REGISTRATIONS = [];

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
    margin:       0, 
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, windowWidth: 1024 }, 
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(element).save();
};

// ============================================================================
// 4. כותרת, לוגו מרכזי ואזור אישי (MAIN HEADER)
// ============================================================================
const MainHeader = ({ settings, isAdmin, onOpenAdminLogin, onLogout, currentUser, setCurrentUser, setTrainees, onRefresh }) => {
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
          <img src={settings.logoUrl} alt="תהל כושר" className="h-48 sm:h-64 object-contain drop-shadow-2xl hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300" />
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

      {/* ברכת שלום למתאמנת מחוברת */}
      {currentUser && !isAdmin && (
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 bg-white/70 px-6 py-2 rounded-full shadow-sm border border-amber-100/50 backdrop-blur-md text-center mt-[-10px]">
          שלום, {currentUser.full_name.split(' ')[0]} 👋
        </h2>
      )}

      {/* תפריט פעולות מרכזי (למנהלת או למתאמן) */}
      {isAdmin ? (
        <div className="flex flex-wrap justify-center items-center gap-3 bg-white/80 p-3 rounded-2xl shadow-sm border border-amber-100">
          <span className="bg-amber-100 text-amber-800 text-sm px-4 py-2 rounded-full font-bold flex items-center gap-1">
            <ShieldAlert size={16} /> מנהלת פעיל
          </span>
          <button onClick={() => { if(onRefresh) { onRefresh(); alert('הנתונים רועננו בהצלחה!'); } }} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition" title="רענן נתונים מהשרת">
            <RefreshCw size={16} /> רענון
          </button>
          <button
            onClick={onLogout}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition"
          >
            <LogOut size={16} /> יציאה מהניהול
          </button>
        </div>
      ) : currentUser ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full px-4">
          <button onClick={() => { setCurrentUser(null); alert('התנתקת בהצלחה!'); window.location.reload(); }} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-2xl transition flex items-center justify-center gap-2 font-bold text-sm shadow-sm border border-red-100" title="התנתקות">
            <LogOut size={16} /> יציאה
          </button>
          {currentUser.is_approved && (
            <>
              <button
                onClick={openEditModal}
            className="w-full sm:w-auto text-sm font-bold text-gray-800 bg-white hover:bg-gray-50 px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm border border-gray-200"
            title="לחצי לעריכת פרטים אישיים"
          >
            <Edit size={16} className="text-amber-600" />
            שלום, {currentUser.full_name}
          </button>
          <button
            onClick={() => openWhatsApp('972545222008', 'היי תהל, אשמח להתייעץ איתך!')}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <MessageCircle size={18} />
            דברי איתי
          </button>
          </>)}
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
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[11px] text-gray-700 space-y-1">
                <p><strong>תעודת זהות:</strong> {currentUser.id_number || 'לא הוזן'}</p>
                <p><strong>תאריך לידה:</strong> {currentUser.dob ? currentUser.dob.split('-').reverse().join('/') : 'לא הוזן'}</p>
                <p><strong>תאריך הצהרת בריאות:</strong> {currentUser.health_declaration?.signed_at || 'לא קיים'}</p>
                <p><strong>בעיה רפואית דווחה:</strong> {currentUser.health_declaration?.has_medical_condition ? 'כן ⚠️' : 'לא'}</p>
              </div>

              {currentUser.health_declaration && (
                <details className="mt-2 group bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  <summary className="text-xs font-bold text-gray-800 p-3 cursor-pointer select-none flex justify-between items-center bg-gray-100 hover:bg-gray-200 transition">
                    📄 הצגת ההצהרה המלאה שלי
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-3 max-h-48 overflow-y-auto text-[10px] space-y-1 bg-white">
                    {Object.entries(currentUser.health_declaration.answers || {}).map(([k, v], idx) => {
                      const qs = ['מחלת לב', 'כאבים בחזה במנוחה', 'כאבים בחזה בשגרה', 'כאבים בפעילות', 'סחרחורת/שיווי משקל', 'אובדן הכרה', 'אסטמה (תרופות)', 'אסטמה (קוצר נשימה)', 'משפחה - מחלת לב', 'משפחה - מוות פתאומי', 'אימון בהשגחה בלבד', 'מחלה קבועה ומגבילה', 'הריון בסיכון'];
                      return (
                        <div key={k} className="flex justify-between border-b pb-1 border-gray-100">
                          <span className="truncate pr-2">{qs[idx] || k}</span>
                          <span className="font-bold shrink-0">{v ? 'כן ⚠️' : 'לא'}</span>
                        </div>
                      );
                    })}
                    {currentUser.health_declaration.signature_url && (
                      <div className="mt-3">
                        <span className="font-bold text-gray-800">חתימה אישית:</span>
                        <img src={currentUser.health_declaration.signature_url} alt="חתימה" className="h-12 border bg-gray-50 rounded p-1 mt-1 block" />
                      </div>
                    )}
                  </div>
                </details>
              )}

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition shadow-md mt-4">
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
              placeholder="הזני סיסמה...(טלפון)"
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
  // בדיקה אוטומטית האם נדרש חידוש (עברו שנתיים או המנהלת דרשה)
  const isRenewalNeeded = useMemo(() => {
    if (!currentUser || !currentUser.health_declaration) return false;
    if (currentUser.needs_renewal) return true;
    try {
      const cleanDate = currentUser.health_declaration.signed_at.replace(/[^\d\/\-\.]/g, '');
      const parts = cleanDate.split(/[\/\-\.]/);
      if (parts.length >= 3) {
        const signDate = new Date(parts[2], parts[1] - 1, parts[0]);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        if (signDate < twoYearsAgo) return true;
      }
    } catch(e) {}
    return false;
  }, [currentUser]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    dob: '',
    phone: '',
    email: '',
    answers: {}, // שומר את כל התשובות לשאלון (q1, q2a וכו')
    has_medical_condition: false,
    medical_cert_url: '',
    parent_name: '',
    parent_id: '',
    terms_accepted: false
  });
  const [activeTab, setActiveTab] = useState('schedule');
  const sigCanvasRef = useRef({});
  const parentSigCanvasRef = useRef({}); // חתימת הורה לקטין

  const [authMode, setAuthMode] = useState('landing'); 
  const [loginIdNumber, setLoginIdNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState(''); 
  const isRegistered = !!currentUser;
  const isApproved = currentUser?.is_approved;
  
  const hasActivePunchCard = currentUser?.punch_card?.entries > 0 && new Date(currentUser.punch_card.expires_at) >= new Date();
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => localStorage.getItem('tahel_punch_banner_hidden') === 'true');

  // האזנה לקישור דינמי של אימון מהוואטסאפ וגלילה אליו
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wId = params.get('workout');
    if (wId) {
      setTimeout(() => {
        const el = document.getElementById(`workout-${wId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [workouts]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const user = trainees.find(t => t.id_number === loginIdNumber && t.phone === loginPassword);
    if (user) {
      setCurrentUser(user);
      alert('התחברת בהצלחה!');
    } else {
      alert('אימייל או סיסמה שגויים. (סיסמה = מספר הטלפון שלך)');
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!formData.terms_accepted) {
      alert('יש לאשר את תקנון האתר ומדיניות הביטולים.');
      return;
    }
    if (sigCanvasRef.current?.isEmpty()) {
      alert('חובה לחתום בתיבת החתימה הדיגיטלית.');
      return;
    }

    // בדיקת קטין (מתחת ל-18)
    const isMinor = formData.dob && (new Date().getFullYear() - new Date(formData.dob).getFullYear() < 18);
    if (isMinor && parentSigCanvasRef.current?.isEmpty()) {
      alert('היותך מתחת לגיל 18, חובה להחתים הורה/אפוטרופוס.');
      return;
    }

    const signatureData = sigCanvasRef.current.toDataURL();
    const parentSignatureData = isMinor ? parentSigCanvasRef.current.toDataURL() : null;

    const healthDecl = {
      answers: formData.answers,
      has_medical_condition: formData.has_medical_condition,
      medical_cert_url: formData.medical_cert_url,
      signature_url: signatureData,
      parent_name: isMinor ? formData.parent_name : null,
      parent_id: isMinor ? formData.parent_id : null,
      parent_signature_url: parentSignatureData,
      signed_at: `${new Date().toLocaleDateString('he-IL')} | ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
    };

    if (currentUser) {
      // מצב חידוש מתאמנת קיימת - מעדכן את האובייקט הקיים ולא משכפל!
      const updatedUser = { ...currentUser, health_declaration: healthDecl, needs_renewal: false, is_approved: false };
      setTrainees(prev => prev.map(t => t.id === currentUser.id ? updatedUser : t));
      setCurrentUser(updatedUser);
      alert('הצהרת הבריאות עודכנה בהצלחה!');
      openWhatsApp('0545222008', `היי תהל! מילאתי מחדש את הצהרת הבריאות. שמי ${currentUser.full_name}, אשמח לאישור!`);
      setAuthMode('landing');
    } else {
      // מצב מתאמנת חדשה לגמרי
      const newTrainee = {
        id: 'u_' + Date.now(),
        full_name: `${formData.first_name} ${formData.last_name}`,
        id_number: formData.id_number,
        dob: formData.dob,
        phone: formData.phone,
        email: formData.email,
        is_approved: false,
        is_admin: false,
        created_at: new Date().toISOString(),
        health_declaration: healthDecl
      };

      setTrainees(prev => [...prev, newTrainee]);
      setCurrentUser(newTrainee);
      triggerMakeWebhook(settings.makeWebhookUrl, 'new_trainee_registered', newTrainee);
      openWhatsApp('0545222008', `היי תהל! נרשמתי לאתר שמי ${formData.first_name} ${formData.last_name} אני אשמח לאישור שלך!`);
    }
  };

  const handleWorkoutRegister = (workoutId) => {
    if (!currentUser) return;
    if (isRenewalNeeded) {
      alert('עליך לחדש את הצהרת הבריאות שלך לפני שתוכלי להירשם לאימונים.');
      return;
    }
    if (!currentUser.is_approved) {
      alert('החשבון שלך ממתין לאישור תהל. עליך להמתין לאישור לפני הרשמה לאימונים!');
      return;
    }

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

    let appliedPaymentStatus = 'unpaid';
    let updatedUser = { ...currentUser };

    if (currentUser.punch_card && currentUser.punch_card.entries > 0 && new Date(currentUser.punch_card.expires_at) >= new Date()) {
      appliedPaymentStatus = 'punch_card';
      updatedUser.punch_card.entries -= 1;
      setTrainees(prev => prev.map(t => t.id === currentUser.id ? updatedUser : t));
      setCurrentUser(updatedUser);
      alert(`נרשמת בהצלחה לאימון ${workout.type}!\nההרשמה חויבה אוטומטית מהכרטיסייה (נותרו ${updatedUser.punch_card.entries} כניסות).`);
    } else {
      alert(`נרשמת בהצלחה לאימון ${workout.type}!\nנא לשלוח לתהל בביט או בפייבוקס ${workout.price} ₪ למספר 0545222008.`);
    }

    const newReg = {
      id: 'r_' + Date.now(),
      workout_id: workoutId,
      user_id: currentUser.id,
      payment_status: appliedPaymentStatus,
      paid_amount: appliedPaymentStatus === 'punch_card' ? 0 : workout.price,
      created_at: new Date().toISOString()
    };

    setRegistrations(prev => [...prev, newReg]);
    triggerMakeWebhook(settings.makeWebhookUrl, 'workout_registered', { workout, user: updatedUser });
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
      const regToCancel = registrations.find(r => r.workout_id === workoutId && r.user_id === currentUser.id);
      if (regToCancel?.payment_status === 'punch_card') {
        const updatedUser = { ...currentUser };
        if (!updatedUser.punch_card) updatedUser.punch_card = { entries: 0 };
        updatedUser.punch_card.entries += 1;
        setTrainees(prev => prev.map(t => t.id === currentUser.id ? updatedUser : t));
        setCurrentUser(updatedUser);
        alert('האימון בוטל בהצלחה, והכניסה הוחזרה אוטומטית לכרטיסייה שלך!');
      }

      setRegistrations(prev => prev.filter(r => !(r.workout_id === workoutId && r.user_id === currentUser.id)));
      const workoutDateReversed = workout.date.split('-').reverse().join('/');
      const msg = `היי תהל, ביטלתי את האימון!\nשם: ${currentUser.full_name}\nסוג אימון: ${workout.type}\nתאריך: ${workoutDateReversed} בשעה ${workout.time}`;
      // שימוש ישיר ב-location מונע חסימת פופ-אפ בדפדפן
      window.location.href = `https://wa.me/972545222008?text=${encodeURIComponent(msg)}`;
    }
  };

  // ביטול רשימת המתנה
  const handleCancelWaitlist = (workoutId) => {
    if (window.confirm('האם להסיר את עצמך מרשימת ההמתנה?')) {
      setWaitlist(prev => prev.filter(w => !(w.workout_id === workoutId && w.user_id === currentUser.id)));
      alert('הוסרת מרשימת ההמתנה.');
    }
  };

  if (!isRegistered && authMode !== 'guest' && authMode !== 'register') {
    return (
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-amber-100 mt-6">
        {authMode === 'landing' ? (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-black text-gray-900">ברוכות הבאות לתהל פיטנס!</h2>
            <p className="text-gray-600 text-sm">אנא היכנסי לחשבונך או הרשמי כדי לצפות באזור האישי שלך ולהירשם לאימונים.</p>
            <div className="space-y-3">
              <button onClick={() => setAuthMode('login')} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2">
                <LogIn size={18} /> כניסה למשתמשת קיימת
              </button>
              <button onClick={() => setAuthMode('register')} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2">
                <UserPlus size={18} /> הרשמה והצהרת בריאות
              </button>
            </div>
            <button onClick={() => setAuthMode('guest')} className="text-xs text-gray-400 hover:text-gray-600 pt-2 underline">
              המשך כאורחת (צפייה בלוח אימונים בלבד)
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-black text-gray-900 text-center mb-6">כניסה למערכת</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">תעודת זהות</label>
                <input required type="text" value={loginIdNumber} onChange={(e) => setLoginIdNumber(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">(מספר טלפון ) סיסמה</label>
                <input required type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl shadow-lg mt-2">היכנסי</button>
              <button type="button" onClick={() => setAuthMode('landing')} className="w-full text-xs text-gray-500 mt-4 underline text-center block">חזרה לתפריט</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (authMode === 'register') {
    return (
      <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-100">
        <div className="flex justify-between items-center text-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">הרשמה והצהרת בריאות</h2>
            <p className="text-xs text-gray-500 mt-1">מילוי הצהרת הבריאות הינו חובה לפני הרשמה לאימונים.</p>
          </div>
          <button onClick={() => setAuthMode('landing')} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full"><X size={20}/></button>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {!currentUser && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">שם פרטי *</label>
                  <input required type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">שם משפחה *</label>
                  <input required type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">מספר ת.ז *</label>
                  <input required type="text" value={formData.id_number} onChange={(e) => setFormData({...formData, id_number: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">תאריך לידה *</label>
                  <input required type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">טלפון *</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">אימייל *</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
              </div>
            </>
          )}

          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-4 max-h-96 overflow-y-auto">
            <h4 className="font-bold text-sm text-amber-900 flex items-center gap-1.5 border-b pb-2">
              <FileText size={18} /> שאלון רפואי לאימון גופני
            </h4>
            <p className="text-[11px] text-gray-700 leading-tight">
              השאלון הבא נועד לבדוק את כשירותך הגופנית במטרה להתאים עבורך באופן אישי את התכנית הטובה ביותר. על כן, עליי לדעת האם ישנה בעיה רפואית כלשהיא הדורשת התייחסות ספציפית ו/או עלולה להיות גורם מגביל כלשהוא. כל הפרטים בשאלון זה הינם חסויים. יש לסמן במקום המתאים.
            </p>

            <div className="space-y-3 mt-3">
              {[
                { id: 'q1', text: '1. האם הרופא שלך אמר לך שאתה סובל ממחלת לב?' },
                { id: 'q2_header', type: 'header', text: '2. האם אתה חש כאבים בחזה (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)-' },
                { id: 'q2a', text: '(א) בזמן מנוחה?' },
                { id: 'q2b', text: '(ב) במהלך פעילויות שיגרה ביום-יום?' },
                { id: 'q2c', text: '(ג) בזמן שאתה מבצע פעילות גופנית?' },
                { id: 'q3_header', type: 'header', text: '3. האם במהלך השנה החולפת (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)-' },
                { id: 'q3a', text: '(א) איבדת שיווי משקל עקב סחרחורת? סמן לא- אם הסחרחורת נבעה מנשימת יתר (כולל במהלך פעילות גופנית נמרצת).' },
                { id: 'q3b', text: '(ב) איבדת את הכרתך?' },
                { id: 'q4_header', type: 'header', text: '4. האם רופא אבחן שאתה סובל ממחלת האסטמה ולכן בשלושת החודשים האחרונים (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)-' },
                { id: 'q4a', text: '(א) נזקקת לטיפול תרופתי?' },
                { id: 'q4b', text: '(ב) סבלת מקוצר נשימה או צפצופים?' },
                { id: 'q5_header', type: 'header', text: '5. האם אחד מבני משפחתך מדרגת קרבה ראשונה נפטר (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)--' },
                { id: 'q5a', text: '(א) ממחלת לב?' },
                { id: 'q5b', text: '(ב) ממוות פתאומי בגיל מוקדם? (לפני גיל 55 אם מדובר בגבר, ולפני גיל 65 אם זו אישה)' },
                { id: 'q6', text: '6. האם הרופא שלך אמר לך ב-5 השנים האחרונות לבצע פעילות גופנית רק תחת השגחה רפואית?' },
                { id: 'q7', text: '7. האם הינך סובל ממחלה קבועה (כרונית), שאינה נזכרת בשאלות לעיל ועשויה למנוע או להגביל אותך בביצוע פעילות גופנית?' },
                { id: 'q8', text: '8. לנשים בהריון:- האם ההריון הזה או כל הריון קודם הוגדר הריון בסיכון?!' }
              ].map(q => {
                if (q.type === 'header') return <div key={q.id} className="text-[11px] font-bold text-amber-900 mt-2 mb-1">{q.text}</div>;
                return (
                <div key={q.id} className="text-[11px] font-semibold mb-2 border-b border-amber-100 pb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span>{q.text}</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input required type="radio" name={q.id} onChange={() => {
                        setFormData(prev => {
                          const newAns = {...prev.answers, [q.id]: true};
                          return {...prev, answers: newAns, has_medical_condition: Object.values(newAns).some(v => v)};
                        });
                      }} /> כן
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input required type="radio" name={q.id} onChange={() => {
                        setFormData(prev => {
                          const newAns = {...prev.answers, [q.id]: false};
                          return {...prev, answers: newAns, has_medical_condition: Object.values(newAns).some(v => v)};
                        });
                      }} /> לא
                    </label>
                  </div>
                </div>
              );
            })}
            </div>

            {formData.has_medical_condition && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 mt-2 space-y-2">
                <h5 className="font-bold text-red-700 text-sm">נדרש אישור רפואי</h5>
                <p className="text-[11px] text-red-600 leading-relaxed">
                  לצורך קבלתך לאימונים עלייך להמציא גם תעודה רפואית מרופא לפיה הרופא מאשר כי אין סיכון לבריאותך באימון גופני. תעודה רפואית זו תתקבל רק אם לא עברו 3 חודשים ממועד הנפקתה, לפני תחילת האימונים.
                </p>
                <div className="mt-3 bg-white p-3 rounded-lg border border-red-100">
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">העלאת תעודה רפואית (PDF / תמונה)</label>
                  <input type="file" accept="image/*,application/pdf" onChange={async (e) => {
                    const file = e.target.files[0];
                    if(file) {
                      const url = await uploadToCloudinary(file, settings.cloudinaryCloudName, settings.cloudinaryPreset);
                      setFormData({...formData, medical_cert_url: url});
                      alert('אישור רפואי הועלה בהצלחה!');
                    }
                  }} className="text-[11px] w-full file:bg-red-100 file:text-red-700 file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 file:font-bold cursor-pointer" />
                </div>
              </div>
            )}

            <div className="text-[10px] text-gray-600 leading-relaxed space-y-1.5 pt-3">
              <p className="font-bold text-amber-900 text-xs">הנחיות כלליות</p>
              <ol className="list-decimal pr-4 space-y-1">
                <li>אם סימנת כן באחת השאלות בשאלון הרפואי לעיל - לצורך קבלתך לאימונים עלייך להמציא גם תעודה רפואית מרופא לפיה הרופא מאשר כי אין סיכון לבריאותך באימון גופני. תעודה רפואית זו תתקבל רק אם לא עברו 3 חודשים ממועד הנפקתה, לפני תחילת האימונים.</li>
                <li>אם ענית לא לכל השאלות בשאלון הרפואי לעיל - מלא את ההצהרה שלהלן וחתום עליה.</li>
                <li>בכל מקרה של שינוי במצבך הרפואי, יש להתייעץ עם רופא לגבי המשך פעילות.</li>
              </ol>
              
              <div className="pt-2">
                <p className="font-bold underline mb-1">הצהרה:</p>
                <p>א. במהלך תקופת האימונים ייעשה כל מאמץ לשמור על בריאותך ובטיחותך באימונים. אף על פי כן, כמו בכל תכנית אימונים, ישנם סיכונים. בהיענותך לקיים פעילות גופנית במסגרת זו הנך מצהיר/ה כי ככל הידוע לך אין כל מניעה להשתתפותך בפעילות זו.</p>
                <p>ב. אנו ממליצים לעבור בדיקת רופא לפני כל תחילת תכנית אימונים בייחוד אם הנך סובל/ת מבעיות לב/ לחץ דם גבוה/ כאבים בחזה/ עברת ניתוחים בעבר/ סוכרת/ אסטמה/ אפילפסיה או כל פציעה משמעותית גופנית.</p>
                <p>ג. בחתימה על מסמך זה הנך מקבל על עצמך אחריות מלאה למצבך הבריאותי ומסיר כל אחריות מתהל בן משה, כעת ובעתיד לכל שינוי במצבך הבריאותי כתוצאה מפעילות גופנית זו לרבות: התקף לב, כאבי שרירים, קרעים בשריר, שברים, פגיעות חום, כאבי ברכיים, גב או כל כאב אחר ומוות.</p>
              </div>

              <div className="pt-4 pb-2">
                <p className="font-bold underline mb-1">הצהרת בריאות:</p>
                <p>אני הח"מ מצהיר/ה בזה כי מצב בריאותי תקין וכי איני סובל/ת מכל מחלה ומגבלה, שיש בהם כדי להשפיע או למנוע את השתתפותי בכל פעילות גופנית. במידה והנני סובל/ת מבעיות כאמור, הנני מתחייב לפרטן על גבי מסמך זה וכן בעל פה למאמן הכושר. במידה ולא אעשה כן, הרי שכל פגיעה בי בעת קיום הפעילות הנ"ל הינה על אחריותי בלבד. הנני מתחייב להודיע על כל שינוי שיחול במצבי הבריאותי ו/או בכושרי הפיזי. כמו כן הנני מצהיר/ה שכל הפרטים אשר מסרתי ומילאתי לעיל, הינם נכונים.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-amber-200">
              <input required type="checkbox" id="terms" checked={formData.terms_accepted} onChange={(e) => setFormData({...formData, terms_accepted: e.target.checked})} className="w-4 h-4 text-amber-600 rounded mt-0.5" />
              <label htmlFor="terms" className="text-[11px] font-bold text-gray-800 leading-tight">
                *** אני הח"מ מצהיר/ה בזאת שקראתי והבנתי את כל הכתוב לעיל וכי הנני מסכים/ה לכל האמור:
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">חתימת המתאמן *</label>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden touch-none">
                <SignatureCanvas ref={sigCanvasRef} penColor="#1f2937" canvasProps={{ className: 'w-full h-24 cursor-crosshair' }} />
              </div>
              <button type="button" onClick={() => sigCanvasRef.current?.clear()} className="text-[10px] text-gray-500 hover:text-red-500 mt-1 font-semibold flex items-center gap-1">
                <RefreshCw size={10} /> נקי חתימה
              </button>
            </div>

            {formData.dob && (new Date().getFullYear() - new Date(formData.dob).getFullYear() < 18) && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mt-4 space-y-3">
                <h5 className="font-bold text-blue-800 text-xs">אישור הורה/אפוטרופוס למתאמן קטין</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">שם ההורה *</label>
                    <input type="text" onChange={e => setFormData({...formData, parent_name: e.target.value})} className="w-full p-2 rounded border outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">מספר ת.ז הורה *</label>
                    <input type="text" onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full p-2 rounded border outline-none text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">חתימת הורה/אפוטרופוס *</label>
                  <div className="bg-white border border-gray-300 rounded overflow-hidden touch-none">
                    <SignatureCanvas ref={parentSigCanvasRef} penColor="#1f2937" canvasProps={{ className: 'w-full h-20 cursor-crosshair' }} />
                  </div>
                </div>
              </div>
            )}
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

  

  const now = new Date();
  const upcomingWorkouts = workouts
    .filter(w => new Date(`${w.date}T${w.time}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

 const myRegistrations = (registrations || []).filter(r => r?.user_id === currentUser?.id);
  const myRegisteredWorkoutIds = myRegistrations.map(r => r.workout_id);

  const myWaitlistEntries = (waitlist || []).filter(w => w?.user_id === currentUser?.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {isRegistered && isRenewalNeeded && authMode !== 'register' && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-600" size={24} />
            <div>
              <h3 className="font-black text-red-900 text-sm">נדרש חידוש הצהרת בריאות</h3>
              <p className="text-xs text-red-800">על מנת להמשיך להירשם לאימונים, חובה עליך למלא את ההצהרה מחדש.</p>
            </div>
          </div>
          <button onClick={() => {
            setFormData(prev => ({
              ...prev, 
              first_name: currentUser.full_name.split(' ')[0], 
              last_name: currentUser.full_name.split(' ').slice(1).join(' ') || '', 
              id_number: currentUser.id_number || '', 
              dob: currentUser.dob || '', phone: currentUser.phone || '', email: currentUser.email || '',
              answers: {}, has_medical_condition: false, medical_cert_url: '', parent_name: '', parent_id: '', terms_accepted: false
            }));
            setAuthMode('register'); 
          }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0">
            למילוי ההצהרה
          </button>
        </div>
      )}

      {!isRegistered && (
        <div className="bg-gray-900 text-white p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md animate-fadeIn">
          <div className="text-center sm:text-right">
            <h3 className="font-black text-amber-400 text-sm">מצב צפייה כאורחת</h3>
            <p className="text-xs text-gray-300 mt-0.5">כדי להירשם לאימונים ולצפות באזור האישי, אנא התחברי או הרשמי למערכת.</p>
          </div>
          <button onClick={() => setAuthMode('landing')} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-sm">
            <LogIn size={16} />
            התחברות / הרשמה
          </button>
        </div>
      )}

      {isRegistered && isApproved && !hasActivePunchCard && !isBannerDismissed && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm mb-4 cursor-pointer hover:bg-amber-200 transition" onClick={() => openWhatsApp('0545222008', 'אשמח לשמוע פרטים על כרטיסייה')}>
          <div className="flex items-center gap-2">
            <MessageCircle size={16} />
            <span>אשמח לשמוע פרטים על רכישת כרטיסייה 🎟️</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsBannerDismissed(true);
              localStorage.setItem('tahel_punch_banner_hidden', 'true');
            }} 
            className="p-1 hover:bg-amber-300 rounded-full transition text-amber-700"
            title="הסתר הודעה"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {isRegistered && isApproved && currentUser?.punch_card?.entries > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 px-4 py-3 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center text-xs font-bold shadow-sm mb-4 gap-2">
          <div className="flex items-center gap-2 text-indigo-900">
            <Award size={18} className="text-indigo-600" />
            <span>כרטיסייה פעילה: נותרו {currentUser.punch_card.entries} כניסות</span>
          </div>
          <span className={`px-2 py-1 rounded-lg ${new Date(currentUser.punch_card.expires_at) - new Date() <= 14 * 24 * 60 * 60 * 1000 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-100 text-indigo-700'}`}>
            תוקף: {new Date(currentUser.punch_card.expires_at).toLocaleDateString('he-IL')}
            {new Date(currentUser.punch_card.expires_at) - new Date() <= 14 * 24 * 60 * 60 * 1000 && ' (פג תוקף בקרוב!)'}
          </span>
        </div>
      )}

      {isRegistered && !isApproved && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <Clock className="text-amber-600" size={24} />
            <div>
              <h3 className="font-black text-amber-900 text-sm">תודה שנרשמת! החשבון ממתין לאישור</h3>
              <p className="text-xs text-amber-800">תוכלי לצפות בלוח האימונים, אך ההרשמה תיפתח רק לאחר אישור מתהל.</p>
            </div>
          </div>
          <button onClick={() => openWhatsApp('0545222008', `היי תהל!\nשמי ${currentUser.full_name}\nנרשמתי לאתר, אשמח לאישור!`)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0">
            <MessageCircle size={14} /> תזכורת בוואטסאפ
          </button>
        </div>
      )}

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
            <div className="bg-white/90 p-8 rounded-3xl text-center text-gray-500 font-bold">
              אין אימונים פעילים כרגע
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
                  id={`workout-${workout.id}`}
                  className={`bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-lg border transition duration-200 scroll-mt-24 ${
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
                          <Calendar size={14} /> {workout.date.split('-').reverse().join('/')} בשעה {workout.time}
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
                          onClick={() => {
                            if (!currentUser) {
                              setAuthMode('landing'); // החזרה למסך התחברות/הרשמה
                            } else {
                              handleWorkoutRegister(workout.id);
                            }
                          }}
                          className="w-full sm:w-auto bg-gray-900 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md transition"
                        >
                          הרשמי לאימון
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100/60">
                    <p className="text-[10px] text-gray-500 font-medium text-center sm:text-right">
                      * האימון יתקיים במידה ויהיו {workout.max_participants} מתאמנות, במידה ולא, ייתכן והאימון יבוטל.
                    </p>
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
                      <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center justify-center gap-1 ${
                        reg.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        reg.payment_status === 'punch_card' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {reg.payment_status === 'paid' ? 'שולם' : reg.payment_status === 'punch_card' ? 'כרטיסייה' : 'טרם שולם'}
                        <span className="text-[10px] font-black opacity-75">| {reg.paid_amount !== undefined ? reg.paid_amount : workout.price} ₪</span>
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
  settings, setSettings, onRefresh 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (onRefresh) onRefresh();
  }, [activeTab]);
  
  const [newWorkout, setNewWorkout] = useState({
    type: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    price: '',
    max_participants: '',
    notes: ''
  });

  const [messageModal, setMessageModal] = useState(null); // { workout, type: 'broadcast' | 'invite' }
  const [messageText, setMessageText] = useState('');
  const [sentMessageUserIds, setSentMessageUserIds] = useState([]);
  
  const [historyModalUser, setHistoryModalUser] = useState(null);
  const [unpaidBroadcastModal, setUnpaidBroadcastModal] = useState(false);
  const [unpaidMessageText, setUnpaidMessageText] = useState('היי [שם פרטי]! רציתי להזכיר שטרם הוסדר תשלום על אימון [פרטי האימון] בסך [מחיר]. אשמח להסדרה!');

  const processMessageText = (text, user, workout) => {
    if (!workout) {
      return text.replace(/\[שם פרטי\]/g, user.full_name.split(' ')[0]).replace(/\[כתובת האתר\]/g, window.location.origin);
    }
    const workoutLink = `${window.location.origin}?workout=${workout.id}`;
    const workoutDetails = `${workout.type} ב-${workout.date.split('-').reverse().join('/')} בשעה ${workout.time} במיקום: ${workout.location}`;
    return text
      .replace(/\[שם פרטי\]/g, user.full_name.split(' ')[0])
      .replace(/\[פרטי האימון\]/g, workoutDetails)
      .replace(/\[מחיר\]/g, workout.price + ' ₪')
      .replace(/\[מיקום מדויק\]/g, workout.location)
      .replace(/\[כתובת האתר\]/g, window.location.origin)
      .replace(/\[קישור האימון\]/g, workoutLink);
  };
  const [financeMonth, setFinanceMonth] = useState('2026-08');
  const [editWorkoutData, setEditWorkoutData] = useState(null); // סטייט לעריכת אימון
  
  const [searchTraineeQuery, setSearchTraineeQuery] = useState('');
  const [searchWorkoutQuery, setSearchWorkoutQuery] = useState('');
  const [punchCardModalUser, setPunchCardModalUser] = useState(null);
  const [punchCardForm, setPunchCardForm] = useState({ entries: 10 });
  const [globalBroadcastModal, setGlobalBroadcastModal] = useState(false);
  const [globalMessageText, setGlobalMessageText] = useState('היי [שם פרטי]! ');
  
  // משתנה זמני לשמירת הגדרות האתר לפני שמירה סופית
  const [tempSettings, setTempSettings] = useState(settings);
  useEffect(() => { setTempSettings(settings); }, [settings]);

  const stats = useMemo(() => {
    const totalTraineesCount = trainees.filter(t => !t.is_archived).length;
    const pendingTraineesCount = trainees.filter(t => !t.is_approved && !t.is_archived).length;
    
    let totalRevenue = 0;
    let unpaidAmount = 0;
    const unpaidDebtsList = [];

    registrations.forEach(reg => {
      const w = workouts.find(item => item.id === reg.workout_id);
      const user = trainees.find(u => u.id === reg.user_id);
      if (!w || !user) return;

      if (reg.payment_status === 'paid') {
        totalRevenue += Number(reg.paid_amount !== undefined ? reg.paid_amount : w.price || 0);
      } else if (reg.payment_status === 'unpaid') {
        unpaidAmount += Number(reg.paid_amount !== undefined ? reg.paid_amount : w.price || 0);
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
      type: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      price: '',
      max_participants: '',
      notes: ''
    });
  };

  const handleDeleteWorkout = (id) => {
    if (window.confirm('האם למחוק אימון זה? כל הרשמות המתאמנים יוסרו.')) {
      setWorkouts(prev => prev.filter(w => w.id !== id));
      setRegistrations(prev => prev.filter(r => r.workout_id !== id));
    }
  };

  const handleUpdateWorkoutSubmit = (e) => {
    e.preventDefault();
    setWorkouts(prev => prev.map(w => 
      w.id === editWorkoutData.id 
        ? { ...editWorkoutData, price: Number(editWorkoutData.price), max_participants: Number(editWorkoutData.max_participants) } 
        : w
    ));
    setEditWorkoutData(null);
    alert('האימון עודכן בהצלחה!');
  };

  const handleApproveTrainee = (trainee) => {
    setTrainees(prev => prev.map(t => t.id === trainee.id ? { ...t, is_approved: true } : t));
    const currentSiteUrl = window.location.origin;
    const msg = `היי ${trainee.full_name}! 👋 אושרת בהצלחה באתר שלי! אפשר עכשיו להירשם לאימונים כאן: ${currentSiteUrl}`;
    openWhatsApp(trainee.phone, msg);
  };

  const handleRejectTrainee = (traineeId) => {
    if (window.confirm('האם לדחות את המתאמן/ת ולהעביר לארכיון?')) {
      setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, is_archived: true, is_approved: false } : t));
    }
  };

  const handleDeleteTrainee = (traineeId, traineeName) => {
    if (window.confirm(`האם להעביר את ${traineeName} לארכיון? המידע שלה יישמר בדוחות הכספיים אך היא תוסר מרשימת הפעילים.`)) {
      setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, is_archived: true, is_approved: false } : t));
      alert('המתאמנת הועברה לארכיון בהצלחה.');
    }
  };

  const handleRestoreTrainee = (traineeId) => {
    setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, is_archived: false, is_approved: true } : t));
    alert('המתאמנת שוחזרה מהארכיון.');
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

  const handleAdminUploadCert = async (traineeId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file, settings.cloudinaryCloudName, settings.cloudinaryPreset);
      setTrainees(prev => prev.map(t => {
        if (t.id === traineeId) {
          return { ...t, health_declaration: { ...t.health_declaration, medical_cert_url: url } };
        }
        return t;
      }));
      alert('האישור הרפואי הועלה ושויך למתאמנת בהצלחה!');
    } catch (err) {
      alert('שגיאה בהעלאת האישור קלאונדרי.');
    }
  };

  const sendEmailWithDetails = (t) => {
    const healthQs = { q1: '1. מחלת לב?', q2a: '2א. כאבים בחזה מנוחה?', q2b: '2ב. כאבים בחזה שגרה?', q2c: '2ג. כאבים בפעילות?', q3a: '3א. סחרחורת?', q3b: '3ב. אובדן הכרה?', q4a: '4א. אסטמה תרופות?', q4b: '4ב. אסטמה קוצר נשימה?', q5a: '5א. משפחה לב?', q5b: '5ב. משפחה מוות פתאומי?', q6: '6. אימון רק בהשגחה?', q7: '7. מחלה קבועה?', q8: '8. הריון בסיכון?' };
    let ansTxt = '';
    if (t.health_declaration?.answers) {
      ansTxt = Object.entries(t.health_declaration.answers).map(([k, v]) => `${healthQs[k] || k}: ${v ? 'כן' : 'לא'}`).join('%0A');
    }
    const emailBody = `שם מלא: ${t.full_name}%0Aתעודת זהות: ${t.id_number || 'לא הוזן'}%0Aתאריך לידה: ${t.dob ? t.dob.split('-').reverse().join('/') : 'לא הוזן'}%0Aטלפון: ${t.phone}%0Aאימייל: ${t.email}%0Aתאריך חתימת הצהרה: ${t.health_declaration?.signed_at || 'לא הוזן'}%0Aיש בעיה רפואית? ${t.health_declaration?.has_medical_condition ? 'כן ⚠️' : 'לא'}%0A%0A--- תשובות שאלון רפואי ---%0A${ansTxt}%0A%0A* שימי לב: קובץ ה-PDF ירד הרגע באופן אוטומטי למחשב/טלפון שלך. תוכלי לגרור או לצרף אותו למייל זה.`;
    
    exportToPdf(`formal_pdf_${t.id}`, `הצהרת_בריאות_${t.full_name}.pdf`);
    setTimeout(() => {
      window.location.href = `mailto:?subject=פרטי מתאמנת והצהרת בריאות - ${t.full_name}&body=${emailBody}`;
    }, 800);
  };

  const checkAdminNeedsRenewal = (t) => {
    if (!t) return false;
    if (t.needs_renewal) return true;
    if (!t.health_declaration?.signed_at) return true;
    try {
      // ניקוי LTR/RTL Marks נסתרים ממכשירי אייפון שקוטעים את האפליקציה
      const cleanDate = t.health_declaration.signed_at.replace(/[^\d\/\-\.]/g, ''); 
      const parts = cleanDate.split(/[\/\-\.]/);
      if (parts.length >= 3) {
        const signDate = new Date(parts[2], parts[1] - 1, parts[0]);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return signDate < twoYearsAgo;
      }
    } catch(e) {
      return true; // במקרה של שגיאת תאריך פשוט נדרוש מהמתאמנת מילוי מחדש
    }
    return false;
  };

  // תצוגת אקורדיון קומפקטית למנהלת לקריאת ההצהרה המלאה (13 שאלות + חתימות)
  const renderHealthDeclarationAccordion = (t) => {
    if (!t.health_declaration) return null;
    return (
      <details className="mt-3 group bg-gray-50 border border-gray-200 rounded-xl overflow-hidden w-full">
        <summary className="text-xs font-bold text-gray-800 p-3 cursor-pointer select-none flex justify-between items-center bg-gray-100 hover:bg-gray-200 transition">
          📄 הצגת שאלון רפואי וחתימות מלא
          <span className="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="p-3 max-h-64 overflow-y-auto text-[11px] space-y-2 bg-white">
          {t.health_declaration.answers && Object.entries(t.health_declaration.answers).map(([k, v], idx) => {
            const qs = ['מחלת לב', 'כאבים בחזה במנוחה', 'כאבים בחזה בשגרה', 'כאבים בפעילות', 'סחרחורת/שיווי משקל', 'אובדן הכרה', 'אסטמה (תרופות)', 'אסטמה (קוצר נשימה)', 'משפחה - מחלת לב', 'משפחה - מוות פתאומי', 'אימון בהשגחה בלבד', 'מחלה קבועה ומגבילה', 'הריון בסיכון'];
            return (
              <div key={k} className="flex justify-between border-b pb-1 border-gray-100">
                <span className="truncate pr-2">{qs[idx] || k}</span>
                <span className="font-bold shrink-0">{v ? 'כן ⚠️' : 'לא'}</span>
              </div>
            );
          })}
          {t.health_declaration.signature_url && (
            <div className="mt-3">
              <span className="font-bold text-gray-800">חתימת המתאמנת:</span>
              <img src={t.health_declaration.signature_url} alt="חתימה" className="h-12 border bg-gray-50 rounded p-1 mt-1 block" />
            </div>
          )}
          {t.health_declaration.parent_name && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="font-bold text-blue-800 mb-1">אישור הורה (קטין):</p>
              <p><strong>שם הורה:</strong> {t.health_declaration.parent_name} | <strong>ת.ז:</strong> {t.health_declaration.parent_id}</p>
              {t.health_declaration.parent_signature_url && (
                <img src={t.health_declaration.parent_signature_url} alt="חתימת הורה" className="h-12 border bg-gray-50 rounded p-1 mt-1 block" />
              )}
            </div>
          )}
        </div>
      </details>
    );
  };

  // ============================================================================
  // תבנית PDF פורמלית ונסתרת המשמשת ליצוא עבור כל מתאמן
  const renderFormalPdfTemplate = (t) => (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div id={`formal_pdf_${t.id}`} className="w-[210mm] h-[292mm] overflow-hidden box-border bg-white p-10 text-right text-black font-sans leading-tight" dir="rtl" style={{ direction: 'rtl', pageBreakAfter: 'avoid' }}>
        <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-black">טופס הצהרת בריאות</h1>
            <h2 className="text-lg font-bold mt-1 text-gray-800">למבקש להתאמן באימוני כושר</h2>
          </div>
          <div className="flex flex-col items-center">
            {settings.logoUrl && <img src={settings.logoUrl} alt="לוגו" className="h-24 object-contain" />}
          </div>
        </div>
        <div className="text-[10px] mb-3 leading-relaxed">
          <p>השאלון הבא נועד לבדוק את כשירותך הגופנית במטרה להתאים עבורך באופן אישי את התכנית הטובה ביותר.</p>
          <p>על כן, עליי לדעת האם ישנה בעיה רפואית כלשהיא הדורשת התייחסות ספציפית ו/או עלולה להיות גורם מגביל כלשהוא. כל הפרטים בשאלון זה הינם חסויים. יש לסמן במקום המתאים.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-3 rounded-lg mb-4 text-xs font-bold border border-gray-300">
          <p>שם ושם משפחה: {t.full_name}</p>
          <p>מספר תעודת זהות: {t.id_number || '___________'}</p>
          <p>תאריך לידה: {t.dob ? t.dob.split('-').reverse().join('/') : '___________'}</p>
          <p>טלפון: {t.phone}</p>
          <p>אימייל: {t.email}</p>
        </div>
        <h3 className="text-lg font-bold mb-2 bg-gray-200 p-1.5 rounded">חלק א': שאלון רפואי</h3>
        <div className="text-[10px] space-y-1 mb-4">
          <p className="mb-1 text-xs">האם סומנו מגבלות רפואיות או תשובות 'כן' בשאלון הדיגיטלי? <span className="font-bold">{t.health_declaration?.has_medical_condition ? 'כן' : 'לא'}</span></p>
          {t.health_declaration?.answers && [
            { id: 'q1', text: '1. האם הרופא שלך אמר לך שאתה סובל ממחלת לב?' },
            { id: 'q2_header', type: 'header', text: '2. האם אתה חש כאבים בחזה (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)-' },
            { id: 'q2a', text: '(א) בזמן מנוחה?' },
            { id: 'q2b', text: '(ב) במהלך פעילויות שיגרה ביום-יום?' },
            { id: 'q2c', text: '(ג) בזמן שאתה מבצע פעילות גופנית?' },
            { id: 'q3_header', type: 'header', text: '3. האם במהלך השנה החולפת (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)-' },
            { id: 'q3a', text: '(א) איבדת שיווי משקל עקב סחרחורת? סמן לא- אם הסחרחורת נבעה מנשימת יתר (כולל במהלך פעילות גופנית נמרצת).' },
            { id: 'q3b', text: '(ב) איבדת את הכרתך?' },
            { id: 'q4_header', type: 'header', text: '4. האם רופא אבחן שאתה סובל ממחלת האסטמה ולכן בשלושת החודשים האחרונים (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)-' },
            { id: 'q4a', text: '(א) נזקקת לטיפול תרופתי?' },
            { id: 'q4b', text: '(ב) סבלת מקוצר נשימה או צפצופים?' },
            { id: 'q5_header', type: 'header', text: '5. האם אחד מבני משפחתך מדרגת קרבה ראשונה נפטר (אנא סמן את תשובתך בכל אחת מהאפשרויות המפורטות מטה)--' },
            { id: 'q5a', text: '(א) ממחלת לב?' },
            { id: 'q5b', text: '(ב) ממוות פתאומי בגיל מוקדם? (לפני גיל 55 אם מדובר בגבר, ולפני גיל 65 אם זו אישה)' },
            { id: 'q6', text: '6. האם הרופא שלך אמר לך ב-5 השנים האחרונות לבצע פעילות גופנית רק תחת השגחה רפואית?' },
            { id: 'q7', text: '7. האם הינך סובל ממחלה קבועה (כרונית), שאינה נזכרת בשאלות לעיל ועשויה למנוע או להגביל אותך בביצוע פעילות גופנית?' },
            { id: 'q8', text: '8. לנשים בהריון:- האם ההריון הזה או כל הריון קודם הוגדר הריון בסיכון?!' }
          ].map(q => {
            if (q.type === 'header') return <div key={q.id} className="font-bold text-gray-800 mt-1">{q.text}</div>;
            return (
            <div key={q.id} className="border-b border-gray-200 pb-0.5 flex justify-between gap-4">
              <span className="text-[10px] text-gray-700 leading-tight pr-2">{q.text}</span>
              <span className="font-bold text-[10px]">{t.health_declaration.answers[q.id] ? 'כן' : 'לא'}</span>
            </div>
          )})}
          {t.health_declaration?.medical_cert_url && <p className="mt-1 text-red-600 font-bold">צורף אישור רפואי חיצוני.</p>}
        </div>
        <h3 className="text-lg font-bold mb-2 bg-gray-200 p-1.5 rounded">חלק ב': הצהרה והצהרת בריאות</h3>
        <div className="text-[9px] mb-3 leading-tight space-y-1">
          <p>א. במהלך תקופת האימונים ייעשה כל מאמץ לשמור על בריאותך ובטיחותך באימונים. אף על פי כן, כמו בכל תכנית אימונים, ישנם סיכונים. בהיענותך לקיים פעילות גופנית במסגרת זו הנך מצהיר/ה כי ככל הידוע לך אין כל מניעה להשתתפותך בפעילות זו.</p>
          <p>ב. אנו ממליצים לעבור בדיקת רופא לפני כל תחילת תכנית אימונים בייחוד אם הנך סובל/ת מבעיות לב/ לחץ דם גבוה/ כאבים בחזה/ עברת ניתוחים בעבר/ סוכרת/ אסטמה/ אפילפסיה או כל פציעה משמעותית גופנית.</p>
          <p>ג. בחתימה על מסמך זה הנך מקבל על עצמך אחריות מלאה למצבך הבריאותי ומסיר כל אחריות מתהל בן משה, כעת ובעתיד לכל שינוי במצבך הבריאותי כתוצאה מפעילות גופנית זו לרבות: התקף לב, כאבי שרירים, קרעים בשריר, שברים, פגיעות חום, כאבי ברכיים, גב או כל כאב אחר ומוות.</p>
          <p className="font-bold pt-1">אני הח"מ מצהיר/ה בזה כי מצב בריאותי תקין וכי איני סובל/ת מכל מחלה ומגבלה, שיש בהם כדי להשפיע או למנוע את השתתפותי בכל פעילות גופנית. במידה והנני סובל/ת מבעיות כאמור, הנני מתחייב לפרטן על גבי מסמך זה וכן בעל פה למאמן הכושר. במידה ולא אעשה כן, הרי שכל פגיעה בי בעת קיום הפעילות הנ"ל הינה על אחריותי בלבד. הנני מתחייב להודיע על כל שינוי שיחול במצבי הבריאותי ו/או בכושרי הפיזי. כמו כן הנני מצהיר/ה שכל הפרטים אשר מסרתי ומילאתי לעיל, הינם נכונים.</p>
          <p className="font-bold pt-1">בכל מקרה של שינוי במצבך הרפואי, לרבות הופעת כאב, פציעה, מגבלה או תסמין חדש, עליך להתייעץ עם רופא בדבר המשך ביצוע פעילות גופנית.</p>
        </div>
        <div className="flex justify-between items-end border-t border-gray-400 pt-3 mt-4">
          <div>
            <p className="font-bold mb-1">חתימת המתאמן/ת:</p>
            {t.health_declaration?.signature_url ? <img src={t.health_declaration.signature_url} className="max-h-12 w-auto object-contain" /> : <p className="text-gray-400 italic">לא נחתם</p>}
          </div>
          <p className="font-bold">תאריך: {t.health_declaration?.signed_at || '___________'}</p>
        </div>
        {t.health_declaration?.parent_name && (
          <div className="mt-4 border-t-2 border-dashed border-gray-400 pt-3">
            <h4 className="font-bold text-sm mb-1">הסכמה בכתב של אחד מהורי הקטין</h4>
            <p className="text-xs mb-2">אני {t.health_declaration.parent_name} (ת.ז: {t.health_declaration.parent_id}) מסכים/ה כי בני/בתי יתאמן בסטודיו.</p>
            {t.health_declaration.parent_signature_url && <img src={t.health_declaration.parent_signature_url} className="max-h-12 w-auto object-contain" />}
          </div>
        )}
      </div>
    </div>
  );

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
          { id: 'trainees', label: `מתאמנים (${stats.pendingTraineesCount ? `! ${stats.pendingTraineesCount}` : stats.totalTraineesCount})`, icon: Users },
          { id: 'finance', label: `כספים ורו"ח ${stats.unpaidDebtsList.length ? '⚠️' : ''}`, icon: CreditCard },
          { id: 'settings', label: 'הגדרות ומיתוג', icon: Settings },
          { id: 'archive', label: 'ארכיון מתאמנים', icon: Archive },
          { id: 'archive_workouts', label: 'ארכיון אימונים', icon: Archive }
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
          <details className="bg-white/95 p-5 rounded-3xl shadow-md border border-gray-100 group">
            <summary className="font-extrabold text-gray-900 text-base flex items-center justify-between cursor-pointer list-none outline-none">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-amber-600" /> 
                הוספת אימון שבועי חדש
              </div>
              <ChevronDown size={20} className="text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>

            <form onSubmit={handleAddWorkoutSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs mt-5 pt-5 border-t border-gray-100">
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
                  placeholder="60"
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
          </details>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="font-bold text-gray-900 text-sm">אימונים עתידיים במערכת ({workouts.filter(w => new Date(`${w.date}T${w.time}`) >= new Date()).length})</h4>
              <div className="relative">
                <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="חיפוש לפי תאריך, סוג, מיקום או מחיר..." value={searchWorkoutQuery} onChange={(e) => setSearchWorkoutQuery(e.target.value)} className="w-full md:w-72 pl-4 pr-9 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-amber-400 transition shadow-sm" />
              </div>
            </div>
            
            {workouts.filter(w => new Date(`${w.date}T${w.time}`) >= new Date()).filter(w => {
              if (!searchWorkoutQuery) return true;
              const q = searchWorkoutQuery.toLowerCase();
              return w.type.toLowerCase().includes(q) || w.location.toLowerCase().includes(q) || w.date.includes(q) || w.price.toString().includes(q);
            }).map(workout => {
              const regList = registrations.filter(r => r.workout_id === workout.id);
              const isPast = false; // האימונים שכאן הם תמיד בעתיד כעת
              
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

                    <div className="flex items-center flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          setMessageModal({ workout, type: 'broadcast' });
                          setMessageText('היי [שם פרטי]! תזכורת לאימון [פרטי האימון] היום. מחכה לך!');
                          setSentMessageUserIds([]);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <MessageCircle size={15} /> תפוצה למשתתפים
                      </button>

                      <button 
                        onClick={() => {
                          setMessageModal({ workout, type: 'invite' });
                          setMessageText('היי [שם פרטי]! נפתח רישום ל[פרטי האימון]. עלות: [מחיר]. להרשמה מהירה לחצי כאן: [קישור האימון]');
                          setSentMessageUserIds([]);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Send size={15} /> שלח הודעה להרשמה
                      </button>

                      <button 
                        onClick={() => setEditWorkoutData(workout)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"
                        title="ערוך פרטי אימון"
                      >
                        <Edit size={18} />
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
                            <span 
                              key={r.id} 
                              onClick={() => {
                                if (r.payment_status === 'paid' || r.payment_status === 'punch_card') {
                                  if (window.confirm('האם לבטל את סימון התשלום?')) {
                                    if (window.confirm('לבטל בטוח?')) {
                                      handleUpdatePaymentStatus(r.id, 'unpaid');
                                      setRegistrations(prev => prev.map(reg => reg.id === r.id ? { ...reg, paid_amount: 0 } : reg));
                                    }
                                  }
                                } else {
                                  const doDiscount = window.confirm(`האם הסכום לתשלום הוא ${workout.price} ₪ (אישור) או שתרצי להזין מחיר ידני (ביטול)?`);
                                  let finalPrice = workout.price;
                                  if (!doDiscount) {
                                    const customAmount = window.prompt('הזיני את הסכום (₪):', workout.price);
                                    if (customAmount === null) return;
                                    finalPrice = Number(customAmount) || workout.price;
                                  }
                                  const isPaidNow = window.confirm('האם התשלום התקבל בפועל (שולם)?\nאישור = שולם, ביטול = טרם שולם');
                                  handleUpdatePaymentStatus(r.id, isPaidNow ? 'paid' : 'unpaid');
                                  setRegistrations(prev => prev.map(reg => reg.id === r.id ? { ...reg, paid_amount: finalPrice } : reg));
                                }
                              }}
                              className="cursor-pointer hover:bg-gray-200 transition bg-gray-100 text-gray-800 text-[11px] px-2.5 py-1 rounded-xl font-medium flex items-center gap-1"
                              title="לחצי כדי לשנות סטטוס תשלום"
                            >
                              {user ? user.full_name : 'מתאמן'} | {r.paid_amount !== undefined ? r.paid_amount : workout.price} ₪
                              <span className={`w-2 h-2 rounded-full ${r.payment_status === 'paid' || r.payment_status === 'punch_card' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
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
              <Clock size={18} className="text-amber-600" /> מתאמנים חדשים שממתינים לאישור ({trainees.filter(t => !t.is_approved && !t.is_archived).length})
            </h3>

            {trainees.filter(t => !t.is_approved && !t.is_archived).length === 0 ? (
              <p className="text-xs text-gray-500">אין מתאמנים שממתינים לאישור כרגע.</p>
            ) : (
              trainees.filter(t => !t.is_approved && !t.is_archived).map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 relative overflow-hidden">
                  {renderFormalPdfTemplate(t)}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{t.full_name} <span className="font-normal text-xs text-gray-500">(ת.ז: {t.id_number || '-'})</span></h4>
                    <p className="text-xs text-gray-500">{t.phone} | {t.email} | ילידת: {t.dob ? t.dob.split('-').reverse().join('/') : '-'}</p>
                    {checkAdminNeedsRenewal(t) && <p className="text-xs font-black text-red-600 mt-1 bg-red-50 inline-block px-2 py-0.5 rounded">ממתין להצהרת בריאות מחדש מהמתאמנת</p>}
                    {t.health_declaration?.has_medical_condition && (
                      <p className="text-xs text-red-600 font-semibold mt-1">⚠️ סומנו תשובות "כן" בשאלון.</p>
                    )}
                    {t.health_declaration?.medical_cert_url ? (
                      <a href={t.health_declaration.medical_cert_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 inline-block">
                        📄 צפייה באישור הרפואי שהועלה
                      </a>
                    ) : t.health_declaration?.has_medical_condition ? (
                      <p className="text-[10px] font-bold text-red-500 mt-1">לא הועלה אישור רפואי ע"י המתאמנת!</p>
                    ) : null}
                    {renderHealthDeclarationAccordion(t)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer">
                      <Upload size={14} /> העלי אישור (תהל)
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleAdminUploadCert(t.id, e)} />
                    </label>
                    <button onClick={() => handleApproveTrainee(t)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-md">
                      <Check size={16} /> אישור
                    </button>
                    <button onClick={() => exportToPdf(`formal_pdf_${t.id}`, `הצהרת_בריאות_${t.full_name}.pdf`)} className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1" title="הורד הצהרת בריאות כ-PDF">
                      <Download size={14} /> PDF
                    </button>
                    <button onClick={() => sendEmailWithDetails(t)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1">
                      <Send size={14} /> מייל
                    </button>
                    <button onClick={() => handleRejectTrainee(t.id)} className="bg-red-100 text-red-600 hover:bg-red-200 text-xs font-bold px-3 py-2 rounded-xl">
                      דחייה
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            {stats.unpaidDebtsList.length > 0 && (
              <div 
                onClick={() => setUnpaidBroadcastModal(true)}
                className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm cursor-pointer hover:bg-red-100 transition mb-4"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={24} />
                  <div>
                    <h3 className="font-black text-red-900 text-sm">חובות פתוחים מאימוני עבר!</h3>
                    <p className="text-xs text-red-800">ישנם {stats.unpaidDebtsList.length} תשלומים חסרים. לחצי כאן לגבייה מרוכזת.</p>
                  </div>
                </div>
                <ChevronRight className="text-red-600" size={20} />
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">מתאמנים פעילים ({trainees.filter(t => t.is_approved && !t.is_archived).length})</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setGlobalBroadcastModal(true)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
                  <MessageCircle size={14} /> הודעה לכולם
                </button>
                <div className="relative">
                  <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
                  <input type="text" placeholder="חיפוש מתאמנים לפי שם, טלפון, אימייל..." value={searchTraineeQuery} onChange={(e) => setSearchTraineeQuery(e.target.value)} className="w-full md:w-72 pl-4 pr-9 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-amber-400 transition shadow-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {trainees.filter(t => t.is_approved && !t.is_archived).filter(t => {
                if (!searchTraineeQuery) return true;
                const q = searchTraineeQuery.toLowerCase();
                return t.full_name.toLowerCase().includes(q) || t.phone.includes(q) || t.email.toLowerCase().includes(q) || (t.id_number && t.id_number.includes(q));
              }).map(t => (
                <div key={t.id} className="bg-white/95 p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  {renderFormalPdfTemplate(t)}
                  {checkAdminNeedsRenewal(t) && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">ממתין להצהרה חדשה</div>}
                  
                  {/* תוכן תצוגה בלבד - ה-PDF נמשך מהתבנית המוסתרת */}
                  <div className="bg-white mb-3">
                    <details className="group">
                      <summary className="font-bold text-base text-gray-800 cursor-pointer flex justify-between items-center bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition list-none">
                        <div className="flex items-center gap-2">
                          <span>{t.full_name}</span>
                          <span className="text-xs text-gray-500 font-normal">({t.phone})</span>
                        </div>
                        <span className="group-open:rotate-180 transition-transform"><ChevronDown size={18} /></span>
                      </summary>
                      <div className="mt-3 space-y-3 px-2">
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                          <p><strong>ת.ז:</strong> {t.id_number || 'לא הוזן'}</p>
                          <p><strong>ת. לידה:</strong> {t.dob ? new Date(t.dob).toLocaleDateString('he-IL') : 'לא הוזן'}</p>
                          <p><strong>אימייל:</strong> {t.email}</p>
                          <p><strong>תאריך חתימה:</strong> {t.health_declaration?.signed_at || new Date(t.created_at).toLocaleDateString('he-IL')}</p>
                        </div>
                        {renderHealthDeclarationAccordion(t)}
                      </div>
                    </details>
                  </div>

                  {/* כפתורי פעולה (לא יופיעו ב-PDF כי הם מחוץ ל-div של ה-PDF) */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => { setPunchCardModalUser(t); setPunchCardForm({ entries: t.punch_card?.entries || 10 }); }}
                      className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold py-2 rounded-xl flex justify-center items-center gap-1 min-w-[100px]"
                    >
                      <Award size={14} /> כרטיסייה
                    </button>
                    <button 
                      onClick={() => setHistoryModalUser(t)}
                      className="flex-1 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold py-2 rounded-xl flex justify-center items-center gap-1 min-w-[120px]"
                    >
                      <Calendar size={14} /> היסטוריית אימונים
                    </button>
                    <label className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold py-2 rounded-xl flex justify-center items-center gap-1 cursor-pointer min-w-[100px]">
                      <Upload size={14} /> העלי אישור
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleAdminUploadCert(t.id, e)} />
                    </label>
                    <button 
                      onClick={() => openWhatsApp(t.phone, `היי ${t.full_name}, תהל כאן!`)}
                      className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold py-2 rounded-xl flex justify-center items-center gap-1 min-w-[80px]"
                    >
                      <MessageCircle size={14} /> הודעה
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm('לדרוש הצהרת בריאות חדשה? המתאמנת תקבל חלונית דרישה בכניסה הבאה לאתר.')) {
                          setTimeout(() => {
                            setTrainees(prev => prev.map(tr => tr.id === t.id ? {...tr, is_approved: false, needs_renewal: true} : tr));
                          }, 150);
                        }
                      }}
                      className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-bold px-2 py-2 rounded-xl flex items-center gap-1 min-w-[90px]"
                    >
                      <RefreshCw size={14} /> דרישת הצהרה
                    </button>
                    <button 
                      onClick={() => exportToPdf(`formal_pdf_${t.id}`, `הצהרת_בריאות_${t.full_name}.pdf`)}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                      title="הורד הצהרת בריאות כ-PDF"
                    >
                      <Download size={14} /> PDF
                    </button>
<button onClick={() => sendEmailWithDetails(t)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1">
                      <Send size={14} /> שלח במייל
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

      {activeTab === 'archive' && (
        <div className="space-y-6">
          <div className="bg-gray-100 border border-gray-300 p-5 rounded-3xl space-y-3">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Archive size={18} className="text-gray-600" /> מתאמנים בארכיון ({trainees.filter(t => t.is_archived).length})
            </h3>
            {trainees.filter(t => t.is_archived).length === 0 ? (
              <p className="text-xs text-gray-500">אין מתאמנים בארכיון כרגע.</p>
            ) : (
              trainees.filter(t => t.is_archived).map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-gray-500 line-through">{t.full_name} <span className="font-normal text-xs text-gray-400">(ת.ז: {t.id_number || '-'})</span></h4>
                    <p className="text-xs text-gray-400">{t.phone} | {t.email} | ילידת: {t.dob ? t.dob.split('-').reverse().join('/') : '-'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        if(window.confirm('האם את בטוחה שברצונך למחוק את המתאמנת לצמיתות?')) {
                          if(window.confirm('אזהרה כפולה: מחיקה זו תעלים את המתאמנת לחלוטין מכל הרישומים כולל כספים. להמשיך?')) {
                            setTrainees(prev => prev.filter(tr => tr.id !== t.id));
                          }
                        }
                      }}
                      className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      מחיקה לצמיתות
                    </button>
                    <button 
                      onClick={() => handleRestoreTrainee(t.id)}
                      className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      שחזור מתאמנת
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'archive_workouts' && (
        <div className="space-y-6">
          <div className="bg-gray-100 border border-gray-300 p-5 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Archive size={18} className="text-gray-600" /> היסטוריית אימונים שעברו ({workouts.filter(w => new Date(`${w.date}T${w.time}`) < new Date()).length})
            </h3>
            
            {workouts.filter(w => new Date(`${w.date}T${w.time}`) < new Date()).length === 0 ? (
              <p className="text-xs text-gray-500">אין אימוני עבר בארכיון.</p>
            ) : (
              workouts.filter(w => new Date(`${w.date}T${w.time}`) < new Date())
                .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`)) // מיון מהחדש לישן
                .map(workout => {
                  const regList = registrations.filter(r => r.workout_id === workout.id);
                  return (
                    <div key={workout.id} className="bg-white/70 p-5 rounded-3xl shadow-sm border border-gray-200 opacity-80">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-gray-900">{workout.type}</span>
                            <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-bold">הושלם</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {workout.date.split('-').reverse().join('/')} בשעה {workout.time} | {workout.location}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-semibold">
                            משתתפים בפועל: {regList.length} / {workout.max_participants}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="מחק אימון עבר לצמיתות"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
              })
            )}
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
                        <td className="p-3 font-extrabold text-gray-900">
                          <input 
                            type="number" 
                            className="w-16 bg-gray-50 border border-gray-200 rounded p-1 text-center font-bold outline-none" 
                            value={reg.paid_amount !== undefined ? reg.paid_amount : workout.price} 
                            onChange={(e) => setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, paid_amount: Number(e.target.value) } : r))}
                          /> ₪
                        </td>
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

      {messageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">
                {messageModal.type === 'broadcast' ? 'תפוצה למשתתפים' : 'שליחת הזמנה להרשמה'} - {messageModal.workout.type}
              </h3>
              <button onClick={() => setMessageModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">נוסח ההודעה (לחצי על התגיות להוספה):</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {['[שם פרטי]', '[פרטי האימון]', '[מחיר]', '[מיקום מדויק]', '[כתובת האתר]', '[קישור האימון]'].map(tag => (
                  <button key={tag} onClick={() => setMessageText(prev => prev + ' ' + tag)} className="bg-gray-100 hover:bg-amber-100 text-gray-700 text-[10px] px-2 py-1 rounded-lg border font-semibold transition cursor-pointer">
                    {tag}
                  </button>
                ))}
              </div>
              <textarea 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs outline-none focus:border-amber-400"
                rows={4}
              />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">רשימת נמענים - לחצי לשליחה:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(messageModal.type === 'broadcast' 
                  ? registrations.filter(r => r.workout_id === messageModal.workout.id).map(r => trainees.find(t => t.id === r.user_id)).filter(Boolean)
                  : trainees.filter(t => t.is_approved && !t.is_archived && !registrations.some(r => r.workout_id === messageModal.workout.id && r.user_id === t.id))
                ).map(user => {
                  const isSent = sentMessageUserIds.includes(user.id);
                  return (
                    <div key={user.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs border border-gray-100">
                      <span className="font-bold text-gray-800">{user.full_name} <span className="font-normal text-[10px] text-gray-500">({user.phone})</span></span>
                      <button 
                        onClick={() => {
                          const finalMsg = processMessageText(messageText, user, messageModal.workout);
                          openWhatsApp(user.phone, finalMsg);
                          if (!isSent) setSentMessageUserIds(prev => [...prev, user.id]);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                          isSent ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                        }`}
                      >
                        {isSent ? <CheckCircle2 size={14} /> : <MessageCircle size={14} />}
                        <span>{isSent ? 'נשלח ✓' : 'שלחי'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={() => setMessageModal(null)} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2 hover:bg-gray-800 transition">
              סגרי חלון
            </button>
          </div>
        </div>
      )}

      {unpaidBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">גביית חובות מאימוני עבר</h3>
              <button onClick={() => setUnpaidBroadcastModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">נוסח ההודעה (לחצי על התגיות להוספה):</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {['[שם פרטי]', '[פרטי האימון]', '[מחיר]'].map(tag => (
                  <button key={tag} onClick={() => setUnpaidMessageText(prev => prev + ' ' + tag)} className="bg-gray-100 hover:bg-red-100 text-gray-700 text-[10px] px-2 py-1 rounded-lg border font-semibold transition cursor-pointer">
                    {tag}
                  </button>
                ))}
              </div>
              <textarea 
                value={unpaidMessageText}
                onChange={(e) => setUnpaidMessageText(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs outline-none focus:border-red-400"
                rows={4}
              />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">רשימת מתאמנים עם תשלום חסר:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {stats.unpaidDebtsList.map((debt, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 p-2.5 rounded-xl text-xs border border-gray-200 gap-2">
                    <div>
                      <span className="font-bold text-gray-800">{debt.user.full_name}</span>
                      <p className="text-[10px] text-gray-500">{debt.workout.type} - {debt.workout.date}</p>
                      <p className="text-[10px] font-bold text-red-600">{debt.amount} ₪</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const finalMsg = processMessageText(unpaidMessageText, debt.user, debt.workout);
                          openWhatsApp(debt.user.phone, finalMsg);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition"
                      >
                        <MessageCircle size={14} /> וואטסאפ
                      </button>
                      <button 
                        onClick={() => handleUpdatePaymentStatus(debt.regId, 'paid')}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition"
                      >
                        <Check size={14} /> סמן שולם
                      </button>
                    </div>
                  </div>
                ))}
                {stats.unpaidDebtsList.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4 font-bold">כל החובות הוסדרו!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {historyModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">היסטוריית אימונים - {historyModalUser.full_name}</h3>
              <button onClick={() => setHistoryModalUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {registrations.filter(r => r.user_id === historyModalUser.id).length === 0 ? (
                <p className="text-xs text-gray-500">המתאמנת לא רשומה לאף אימון במערכת.</p>
              ) : (
                registrations.filter(r => r.user_id === historyModalUser.id)
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(r => {
                  const w = workouts.find(wo => wo.id === r.workout_id);
                  if (!w) return null;
                  return (
                    <div key={r.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{w.type}</p>
                        <p className="text-xs text-gray-500">{w.date.split('-').reverse().join('/')} | {w.time}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${r.payment_status === 'paid' || r.payment_status === 'punch_card' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {r.payment_status === 'paid' ? 'שולם' : r.payment_status === 'punch_card' ? 'כרטיסייה' : 'לא שולם'} ({r.paid_amount !== undefined ? r.paid_amount : w.price} ₪)
                        </span>
                        <button 
                          onClick={() => {
                            if (r.payment_status === 'paid' || r.payment_status === 'punch_card') {
                              if (window.confirm('האם לבטל את סימון התשלום?')) {
                                if (window.confirm('לבטל בטוח?')) {
                                  handleUpdatePaymentStatus(r.id, 'unpaid');
                                  setRegistrations(prev => prev.map(reg => reg.id === r.id ? { ...reg, paid_amount: 0 } : reg));
                                }
                              }
                            } else {
                              const doDiscount = window.confirm(`האם הסכום לתשלום הוא ${w.price} ₪ (אישור) או שתרצי להזין מחיר ידני (ביטול)?`);
                              let finalPrice = w.price;
                              if (!doDiscount) {
                                const customAmount = window.prompt('הזיני את הסכום (₪):', w.price);
                                if (customAmount === null) return; 
                                finalPrice = Number(customAmount) || w.price;
                              }
                              const isPaidNow = window.confirm('האם התשלום התקבל בפועל (שולם)?\nאישור = שולם, ביטול = טרם שולם');
                              handleUpdatePaymentStatus(r.id, isPaidNow ? 'paid' : 'unpaid');
                              setRegistrations(prev => prev.map(reg => reg.id === r.id ? { ...reg, paid_amount: finalPrice } : reg));
                            }
                          }}
                          className="text-[10px] text-blue-600 underline font-semibold cursor-pointer hover:text-blue-800"
                        >
                          שנה סטטוס תשלום
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={() => setHistoryModalUser(null)} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2 hover:bg-gray-800 transition">
              סגרי חלון
            </button>
          </div>
        </div>
      )}

      {punchCardModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">ניהול כרטיסייה - {punchCardModalUser.full_name}</h3>
              <button onClick={() => setPunchCardModalUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              {punchCardModalUser.punch_card ? (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  <p className="text-sm font-bold text-indigo-900">סטטוס כרטיסייה נוכחי:</p>
                  <p className="text-xs text-indigo-800 mt-1">יתרת כניסות: <strong>{punchCardModalUser.punch_card.entries}</strong></p>
                  <p className="text-xs text-indigo-800">בתוקף עד: <strong>{new Date(punchCardModalUser.punch_card.expires_at).toLocaleDateString('he-IL')}</strong></p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-bold bg-gray-50 p-3 rounded-xl">למתאמנת אין כרטיסייה פעילה.</p>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">כמה כניסות להזין? (שבועות תוקף):</label>
                <input 
                  type="number" 
                  min="1"
                  value={punchCardForm.entries} 
                  onChange={e => setPunchCardForm({ entries: Number(e.target.value) })}
                  className="w-full p-3 border rounded-xl text-sm outline-none focus:border-indigo-500 bg-gray-50"
                />
              </div>

              <button 
                onClick={() => {
                  if (punchCardModalUser.punch_card) {
                    if (!window.confirm('שימי לב: הקצאת כניסות חדשות תדרוס ותאריך את התוקף הקיים בהתאם למספר השבועות החדש. להמשיך?')) return;
                    if (!window.confirm('אזהרה כפולה: האם את בטוחה שברצונך לשנות את פרטי הכרטיסייה הקיימת?')) return;
                  }
                  
                  const expires = new Date();
                  expires.setDate(expires.getDate() + (punchCardForm.entries * 7)); // כל כניסה = שבוע תוקף
                  
                  const updatedUser = { 
                    ...punchCardModalUser, 
                    punch_card: { entries: punchCardForm.entries, expires_at: expires.toISOString() } 
                  };
                  
                  setTrainees(prev => prev.map(t => t.id === updatedUser.id ? updatedUser : t));
                  alert('הכרטיסייה הוקצתה והתוקף חושב בהצלחה!');
                  setPunchCardModalUser(null);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <Award size={18} /> שמירה ועדכון כרטיסייה
              </button>
            </div>
          </div>
        </div>
      )}

      {globalBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">הודעת תפוצה לכל המתאמנים</h3>
              <button onClick={() => setGlobalBroadcastModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">נוסח ההודעה הכללית:</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {['[שם פרטי]', '[כתובת האתר]'].map(tag => (
                  <button type="button" key={tag} onClick={() => setGlobalMessageText(prev => prev + ' ' + tag)} className="bg-gray-100 hover:bg-emerald-100 text-gray-700 text-[10px] px-2 py-1 rounded-lg border font-semibold transition cursor-pointer">
                    {tag}
                  </button>
                ))}
              </div>
              <textarea 
                value={globalMessageText}
                onChange={(e) => setGlobalMessageText(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs outline-none focus:border-emerald-400"
                rows={4}
              />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">רשימת נמענים פעילים:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {trainees.filter(t => t.is_approved && !t.is_archived).map(user => {
                  const isSent = sentMessageUserIds.includes(user.id);
                  return (
                    <div key={user.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs border border-gray-100">
                      <span className="font-bold text-gray-800">{user.full_name}</span>
                      <button 
                        onClick={() => {
                          const finalMsg = processMessageText(globalMessageText, user, null);
                          openWhatsApp(user.phone, finalMsg);
                          if (!isSent) setSentMessageUserIds(prev => [...prev, user.id]);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                          isSent ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                        }`}
                      >
                        {isSent ? <CheckCircle2 size={14} /> : <MessageCircle size={14} />}
                        <span>{isSent ? 'נשלח ✓' : 'שלחי'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setGlobalBroadcastModal(false)} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs mt-2 hover:bg-gray-800 transition">סגרי חלון</button>
          </div>
        </div>
      )}

      {/* מודאל עריכת אימון */}
      {editWorkoutData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">עריכת אימון: {editWorkoutData.type}</h3>
              <button onClick={() => setEditWorkoutData(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateWorkoutSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">סוג האימון</label>
                <input required type="text" value={editWorkoutData.type} onChange={(e) => setEditWorkoutData({...editWorkoutData, type: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">תאריך</label>
                <input required type="date" value={editWorkoutData.date} onChange={(e) => setEditWorkoutData({...editWorkoutData, date: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">שעה</label>
                <input required type="time" value={editWorkoutData.time} onChange={(e) => setEditWorkoutData({...editWorkoutData, time: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">מיקום</label>
                <input required type="text" value={editWorkoutData.location} onChange={(e) => setEditWorkoutData({...editWorkoutData, location: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">מחיר (₪)</label>
                <input required type="number" min="1" value={editWorkoutData.price} onChange={(e) => setEditWorkoutData({...editWorkoutData, price: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">מקסימום משתתפים</label>
                <input required type="number" min="1" value={editWorkoutData.max_participants} onChange={(e) => setEditWorkoutData({...editWorkoutData, max_participants: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">הערות</label>
                <input type="text" value={editWorkoutData.notes || ''} onChange={(e) => setEditWorkoutData({...editWorkoutData, notes: e.target.value})} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div className="sm:col-span-2 pt-2 pb-4 border-b border-gray-100">
                <button type="submit" className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 shadow-md transition">שמירת שינויים באימון</button>
              </div>
            </form>

            <div className="mt-4">
              <h4 className="font-bold text-sm text-gray-900 mb-3">ניהול משתתפים לאימון זה:</h4>
              <div className="flex gap-2 mb-3">
                <select 
                  className="flex-1 p-2.5 bg-gray-50 border rounded-xl text-xs outline-none"
                  onChange={(e) => {
                    if(!e.target.value) return;
                    const newReg = { id: 'r_' + Date.now(), workout_id: editWorkoutData.id, user_id: e.target.value, payment_status: 'unpaid', created_at: new Date().toISOString() };
                    setRegistrations(prev => [...prev, newReg]);
                    e.target.value = '';
                    alert('המתאמן/ת צורפ/ה בהצלחה לאימון!');
                  }}
                >
                  <option value="">+ בחרי מתאמנת להוספה לאימון...</option>
                  {trainees.filter(t => t.is_approved && !t.is_archived && !registrations.some(r => r.workout_id === editWorkoutData.id && r.user_id === t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.phone})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {registrations.filter(r => r.workout_id === editWorkoutData.id).map(r => {
                  const u = trainees.find(t => t.id === r.user_id);
                  if(!u) return null;
                  return (
                    <div key={r.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                      <span className="font-bold text-gray-800">{u.full_name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (r.payment_status === 'paid' || r.payment_status === 'punch_card') {
                              if (window.confirm('האם לבטל את סימון התשלום?')) {
                                if (window.confirm('לבטל בטוח?')) {
                                  handleUpdatePaymentStatus(r.id, 'unpaid');
                                  setRegistrations(prev => prev.map(reg => reg.id === r.id ? { ...reg, paid_amount: 0 } : reg));
                                }
                              }
                            } else {
                              const doDiscount = window.confirm(`האם הסכום לתשלום הוא ${editWorkoutData.price} ₪ (אישור) או שתרצי להזין מחיר ידני (ביטול)?`);
                              let finalPrice = editWorkoutData.price;
                              if (!doDiscount) {
                                const customAmount = window.prompt('הזיני את הסכום (₪):', editWorkoutData.price);
                                if (customAmount === null) return; 
                                finalPrice = Number(customAmount) || editWorkoutData.price;
                              }
                              const isPaidNow = window.confirm('האם התשלום התקבל בפועל (שולם)?\nאישור = שולם, ביטול = טרם שולם');
                              handleUpdatePaymentStatus(r.id, isPaidNow ? 'paid' : 'unpaid');
                              setRegistrations(prev => prev.map(reg => reg.id === r.id ? { ...reg, paid_amount: finalPrice } : reg));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold transition ${r.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.payment_status === 'punch_card' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {r.payment_status === 'paid' ? 'שולם ✓' : r.payment_status === 'punch_card' ? 'שולם כרטיסייה' : 'טרם שולם'} ({r.paid_amount !== undefined ? r.paid_amount : editWorkoutData.price} ₪)
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm(`להסיר את ${u.full_name} מהאימון?`)) {
                              if(window.confirm('אזהרה כפולה: פעולה זו תמחק את הרישום שלה לאימון זה לחלוטין. להמשיך?')) {
                                if (r.payment_status === 'punch_card') {
                                  setTrainees(prev => prev.map(tr => {
                                    if (tr.id === u.id && tr.punch_card) {
                                      return { ...tr, punch_card: { ...tr.punch_card, entries: tr.punch_card.entries + 1 } };
                                    }
                                    return tr;
                                  }));
                                  alert('הכניסה הוחזרה אוטומטית למלאי הכרטיסייה של המתאמנת!');
                                }
                                setRegistrations(prev => prev.filter(reg => reg.id !== r.id));
                              }
                            }
                          }}
                          className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition"
                        >
                          {r.payment_status === 'punch_card' ? 'הסרה + החזר כרטיסייה' : 'הסרה'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// ============================================================================
// 7.5 פוטר ותקנונים (FOOTER & LEGAL MODALS)
// ============================================================================
const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);

  const renderModal = () => {
    if (!activeModal) return null;
    let title = '';
    let content = '';

    if (activeModal === 'terms') {
      title = 'תנאי שימוש';
      content = (
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>ברוכות הבאות לאתר של תהל בן משה. השימוש באתר ובשירותים כפוף לתנאים הבאים:</p>
          <ul className="list-disc pr-5 space-y-1">
            <li><strong>הצהרת בריאות:</strong> כל מתאמנת חייבת למלא הצהרת בריאות כדין לפני אימון ראשון. באחריות המתאמנת לעדכן את מאמנת הכושר על כל שינוי במצבה הרפואי.</li>
            <li><strong>מדיניות ביטולים:</strong> ביטול השתתפות באימון יתאפשר עד 12 שעות לפני תחילת האימון. ביטול לאחר פרק זמן זה יחויב בתשלום מלא על האימון.</li>
            <li><strong>רשימת המתנה:</strong> הרישום לאימונים מבוסס על מקום פנוי. שיבוץ מרשימת ההמתנה תלוי בביטולים של מתאמנות אחרות ואינו מובטח.</li>
            <li><strong>הגבלת אחריות:</strong> האימונים מבוצעים באחריות המתאמנת. הסטודיו והמאמנת לא יישאו באחריות לכל נזק גופני שייגרם כתוצאה מאי דיווח רפואי מדויק או הסתרת מידע על ידי המתאמנת.</li>
          </ul>
        </div>
      );
    } else if (activeModal === 'privacy') {
      title = 'מדיניות פרטיות';
      content = (
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>פרטיותך חשובה לנו. להלן הפירוט לגבי אופן איסוף ושמירת המידע שלך באתר:</p>
          <ul className="list-disc pr-5 space-y-1">
            <li><strong>איסוף נתונים:</strong> אנו אוספים פרטים אישיים בסיסיים (שם, טלפון, ת.ז) והצהרות רפואיות הנדרשות על פי חוק מכוני הכושר לשם השתתפות באימונים.</li>
            <li><strong>שמירת המידע:</strong> המידע נשמר בצורה מאובטחת במערכות האתר ואינו מועבר לשום צד שלישי מסחרי. מידע רפואי עשוי להיות מועבר לצוות רפואי אך ורק במקרי חירום.</li>
            <li><strong>זכויותייך:</strong> תוכלי לדרוש בכל עת לעיין במידע שנאסף עלייך או לבקש להסיר את פרטייך האישיים מהמערכת על ידי פנייה ישירה לתהל. במקרה של מחיקה, היסטוריית התשלומים תישמר באופן אנונימי לצורכי מס כחוק.</li>
          </ul>
        </div>
      );
    } else if (activeModal === 'accessibility') {
      title = 'הצהרת נגישות';
      content = (
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>אנו רואים חשיבות רבה במתן שירות שוויוני, מכבד ונגיש לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות.</p>
          <ul className="list-disc pr-5 space-y-1">
            <li><strong>נגישות דיגיטלית:</strong> אתר זה פותח במטרה לאפשר גלישה נוחה ונגישה. האתר מותאם למסכים בגדלים שונים, מכיל ניגודיות סבירה לטקסטים, ומשתמש ברכיבי ניווט ברורים.</li>
            <li><strong>סיוע פרטני:</strong> במידה ונתקלת בקושי כלשהו בגלישה באתר, במילוי טופס הצהרת הבריאות, או בהרשמה לאימונים, נשמח לסייע לך באופן אישי.</li>
            <li><strong>יצירת קשר לנושאי נגישות:</strong> ניתן לפנות אלינו ישירות בוואטסאפ או בטלפון למספר 054-5222008 ונדאג לטפל בבקשתך בהקדם האפשרי.</li>
          </ul>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
        <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-amber-100 max-h-[85vh] overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="font-black text-xl text-gray-900">{title}</h3>
            <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {content}
          </div>
          <button onClick={() => setActiveModal(null)} className="mt-6 w-full bg-gray-900 text-white font-bold py-3 rounded-2xl shadow-lg hover:opacity-95 transition">קראתי והבנתי, סגירה</button>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-16 mb-4 flex justify-center items-center gap-3 text-xs sm:text-sm text-gray-500 font-medium">
      <button onClick={() => setActiveModal('terms')} className="hover:text-amber-700 transition hover:underline">תנאי שימוש</button>
      <span className="text-gray-300 text-[10px]">●</span>
      <button onClick={() => setActiveModal('privacy')} className="hover:text-amber-700 transition hover:underline">מדיניות פרטיות</button>
      <span className="text-gray-300 text-[10px]">●</span>
      <button onClick={() => setActiveModal('accessibility')} className="hover:text-amber-700 transition hover:underline">הצהרת נגישות</button>
      {renderModal()}
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

  // סנכרון המשתמש המקומי (לוקאל) עם הנתונים העדכניים שנמשכו מ-Supabase
  useEffect(() => {
    if (currentUser && trainees.length > 0) {
      const updatedUser = trainees.find(t => t.id === currentUser.id);
      // מעדכן את המשתמש הנוכחי רק אם יש שינוי בנתונים (כמו קבלת אישור מנהלת)
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
      }
    }
  }, [trainees]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // עדכון כותרת הדפדפן, הלוגו הקטן ותגיות השיתוף (Open Graph) לפייסבוק/וואטסאפ
  useEffect(() => {
    document.title = "תהל בן משה - מאמנת כושר";
    
    // פונקציית עזר להזרקת תגיות Meta לשיתוף ברשתות חברתיות
    const setOgMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // הגדרת הכותרת והתיאור שיופיעו בוואטסאפ
    setOgMetaTag('og:title', 'תהל בן משה - מאמנת כושר');
    setOgMetaTag('og:description', 'תהל פיטנס - אימוני כוח וחיטוב.!');
    setOgMetaTag('og:type', 'website');

    if (settings.logoUrl) {
      // עדכון ה-Favicon (הסמל הקטן בלשונית)
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logoUrl;
      
      // הגדרת הלוגו כתמונה שמופיעה כשמשתפים את הקישור
      setOgMetaTag('og:image', settings.logoUrl);
    }
  }, [settings.logoUrl]);

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

  // טעינת הנתונים מ-Supabase בפתיחת האתר (סנכרון גלובלי)
  useEffect(() => {
    loadGlobalState();
  }, []);

  // שמירת הנתונים ל-Supabase אוטומטית בכל שינוי
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (!isDataLoaded) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // מונע שמירה אוטומטית ריקה בשנייה שהאתר נטען!
    }
    
    const saveGlobalState = async () => {
      const stateToSave = { settings, workouts, trainees, registrations, waitlist };
      await supabase.from('global_app_state').upsert({ id: 1, state_data: stateToSave });
    };
    
    saveGlobalState();
  }, [settings, workouts, trainees, registrations, waitlist, isDataLoaded]);

  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    if (isDataLoaded) {
      const img1 = new Image(); img1.src = settings.backgroundUrl;
      const img2 = new Image(); img2.src = settings.logoUrl;
      Promise.all([
        new Promise(r => { img1.onload = r; img1.onerror = r; }),
        new Promise(r => { img2.onload = r; img2.onerror = r; })
      ]).then(() => setAppReady(true));
    }
  }, [isDataLoaded, settings.backgroundUrl, settings.logoUrl]);

  if (!appReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white space-y-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold animate-pulse">טוען את המערכת...</h2>
      </div>
    );
  }

  return (
    <Router>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;900&display=swap'); * { font-family: 'Heebo', sans-serif !important; }`}</style>
      <div dir="rtl" className="text-gray-900 antialiased selection:bg-amber-200 relative min-h-screen">
        
        {/* רקע מקובע שתופס את כל המסך גם במובייל וגם בגלילה */}
        <div 
          className="fixed inset-0 z-[-1] bg-cover bg-top h-screen w-screen bg-no-repeat" 
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
            onRefresh={loadGlobalState}
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
                onRefresh={loadGlobalState}
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

          <Footer />
        </div>
      </div>
    </Router>
  );
}