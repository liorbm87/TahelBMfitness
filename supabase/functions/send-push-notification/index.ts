import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // טיפול בבקשות CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. חיבור למסד הנתונים עם הרשאות מנהל
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. הגדרת מפתחות VAPID
    webpush.setVapidDetails(
      'mailto:tahelharari@gmail.com',
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    )

    // 3. קבלת הנתונים מהטריגר/קרון
const payload = await req.json()
const { type, user_id, workout_type } = payload

let usersToNotify: string[] = []
let finalTitle = payload.title || "תהל פיטנס 💪"
let finalBody = payload.body || "יש לך עדכון חדש בסטודיו!"

// שליפת שם הלקוחה אם קיים user_id
let userName = "אהובה"
if (user_id) {
  const { data: traineeData } = await supabase.from('trainees').select('full_name').eq('id', user_id).single()
  if (traineeData?.full_name) {
    userName = traineeData.full_name.split(' ')[0]
  }
}

// בניית הודעות מעוצבות ומותאמות אישית לפי סוג האירוע
switch (type) {
  case 'payment_reminder':
    finalTitle = "תזכורת תשלום 💳"
    finalBody = `היי ${userName}! 💖 ראינו שטרם הסדרת את התשלום לאימון הקרוב. נשמח להסדרה קלילה בביט!`
    break;
  case 'new_workout':
    finalTitle = "אימון חדש בלו\"ז! 🔥"
    finalBody = `היי ${userName}, אימון '${workout_type || "כושר"}' חדש מחכה לך במערכת. מהרי לתפוס מקום!`
    break;
  case 'waitlist_spot':
    finalTitle = "יששש! התפנה מקום 🥳"
    finalBody = `${userName}, הקסם קרה! התפנה לך מקום ברשימת ההמתנה לאימון ${workout_type || ""}. כנסי לשריין!`
    break;
  case 'workout_reminder':
    finalTitle = "האימון שלך מתחיל עוד מעט! ⏰"
    finalBody = `היי ${userName}, תזכורת קטנה שהאימון שלך מתחיל בעוד שעה בדיוק. קחי תיק ובואי לתת בראש! 💪`
    break;
  case 'birthday':
    finalTitle = "מזל טוב ענק! 🎂🥳"
    finalBody = `המון מזל טוב ${userName}! תהל והסטודיו מאחלים לך יום הולדת מהמם מלא בעוצמה, בריאות ואנרגיה שיא!`
    break;
  case 'admin_registration':
    finalTitle = "נרשמה מתאמנת חדשה! 🎯"
    finalBody = `הי תהל, ${userName} נרשמה בהצלחה לאימון ${workout_type || ""}.`
    break;
  case 'admin_cancel':
    finalTitle = "ביטול אימון ⚠️"
    finalBody = `עדכון: ${userName} ביטלה את השתתפותה באימון ${workout_type || ""}.`
    break;
}

    // 4. לוגיקה: למי שולחים? (מנהלת או מתאמנת ספציפית)
    if (type.startsWith('admin_')) {
      // בדיקה אם תהל הדליקה את ההתראה הזו בהגדרות
      const { data: adminSetting } = await supabase.from('notification_settings_admin').select('is_active').eq('id', type).single()
      if (adminSetting && !adminSetting.is_active) {
         return new Response(JSON.stringify({ message: "Admin setting is disabled" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // שליפת כל מכשירי הניהול הרשומים ישירות לפי הסימון is_admin_device
      const { data: adminSubs } = await supabase.from('push_subscriptions').select('user_id').eq('is_admin_device', true)
      if (adminSubs) usersToNotify = adminSubs.map((s: { user_id: string }) => s.user_id)
      
    } else if (user_id) {
       // שליחה למתאמנת ספציפית
       usersToNotify = [user_id]
    }

    if (usersToNotify.length === 0) {
      return new Response(JSON.stringify({ message: "No targets found." }), { headers: corsHeaders })
    }

    // 5. שליפת טוקני הפוש הפעילים של המשתמשים
    const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').in('user_id', usersToNotify)

    if (!subscriptions || subscriptions.length === 0) {
       return new Response(JSON.stringify({ message: "No active push subscriptions." }), { headers: corsHeaders })
    }

    // 6. שליחת הפוש בפועל (ומחיקת טוקנים שנמחקו מהמכשיר)
    const pushPromises = subscriptions.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }
      try {
    await webpush.sendNotification(pushSubscription, JSON.stringify({ title: finalTitle, body: finalBody }))
  } catch (err: any) {
        // אם המשתמש ביטל התראות או שהטוקן פג תוקף - מוחקים מהדאטה בייס
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Push error:', err)
        }
      }
    })

    await Promise.all(pushPromises)

return new Response(
      JSON.stringify({ message: "Push notifications sent!" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})