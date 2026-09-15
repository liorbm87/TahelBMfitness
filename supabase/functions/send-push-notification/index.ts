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
    const { type, title, body, user_id } = payload

    let usersToNotify: string[] = []

    // 4. לוגיקה: למי שולחים? (מנהלת או מתאמנת ספציפית)
    if (type.startsWith('admin_')) {
      // בדיקה אם תהל הדליקה את ההתראה הזו בהגדרות
      const { data: adminSetting } = await supabase.from('notification_settings_admin').select('is_active').eq('id', type).single()
      if (adminSetting && !adminSetting.is_active) {
         return new Response(JSON.stringify({ message: "Admin setting is disabled" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      // מציאת ה-ID של המנהלת (תהל)
      const { data: admins } = await supabase.from('trainees').select('id').eq('is_admin', true)
      if (admins) usersToNotify = admins.map((a: { id: string }) => a.id)
      
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
        await webpush.sendNotification(pushSubscription, JSON.stringify({ title, body }))
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