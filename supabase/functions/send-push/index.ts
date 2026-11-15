// 푸시 발송 함수 (Supabase Edge Function, Deno) — 두 가지로 불린다
// 1) pg_cron이 1분마다: 지금 알림 시각인 습관을 찾아 그 사람의 모든 기기로 보낸다 (x-cron-secret으로 확인)
// 2) 웹 설정 창의 '테스트 알림': 로그인한 본인 기기로만 하나 보낸다 (로그인 토큰으로 확인)
// VAPID 개인 키와 CRON_SECRET은 함수 비밀 값에만 있다. 저장소에는 없다
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'https://personal-hub-wheat.vercel.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

/** 크론이 한 번 건너뛰어도 놓치지 않게, 알림 시각이 지난 5분 안이면 보낸다 (push_log가 두 번 보내는 것을 막는다) */
const WINDOW_MIN = 5

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = { title: string; body: string; url: string; tag: string }
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  try {
    if (CRON_SECRET && req.headers.get('x-cron-secret') === CRON_SECRET) {
      return json(await sendDueHabits(admin))
    }
    // 테스트 알림: 로그인한 본인인지 확인한다
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data.user) return json({ error: '로그인이 필요해요.' }, 401)
    const subs = await subscriptionsOf(admin, [data.user.id])
    const sent = await sendAll(admin, subs, {
      title: 'Personal Hub',
      body: '알림이 잘 와요! 습관에 알림 시각을 정하면 그 시각에 알려 드려요.',
      url: '/todo',
      tag: 'test',
    })
    return json({ devices: subs.length, sent })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

/** 사람마다 자기 시간대로 '지금'을 보고, 오늘 하는 요일이면서 아직 체크 안 한 습관의 알림을 보낸다 */
async function sendDueHabits(admin: SupabaseClient) {
  const { data: habits, error } = await admin
    .from('habits')
    .select('id, user_id, name, emoji, days, alarm_time')
    .not('alarm_time', 'is', null)
  if (error) throw error
  if (!habits.length) return { due: 0, sent: 0 }

  const userIds = [...new Set(habits.map((h) => h.user_id as string))]
  const { data: profiles, error: profileError } = await admin.from('profiles').select('user_id, timezone').in('user_id', userIds)
  if (profileError) throw profileError
  const tzOf = new Map(profiles.map((p) => [p.user_id as string, p.timezone as string]))

  const now = new Date()
  const due = habits.filter((h) => {
    const local = localNow(now, tzOf.get(h.user_id) ?? 'Asia/Seoul')
    const [hh, mm] = (h.alarm_time as string).split(':').map(Number)
    const diff = local.minutes - (hh * 60 + mm)
    return (h.days as number[]).includes(local.weekday) && diff >= 0 && diff < WINDOW_MIN
  })
  if (!due.length) return { due: 0, sent: 0 }

  let sent = 0
  for (const habit of due) {
    const today = localNow(now, tzOf.get(habit.user_id) ?? 'Asia/Seoul').date
    // 이미 체크했으면 알릴 필요가 없다
    const { data: done } = await admin
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habit.id)
      .eq('log_date', today)
      .maybeSingle()
    if (done) continue
    // 기록을 먼저 남겨서, 함수가 겹쳐 불려도 한 번만 보낸다
    const { data: logged } = await admin
      .from('push_log')
      .upsert({ user_id: habit.user_id, kind: 'habit', ref_id: habit.id, sent_on: today }, {
        onConflict: 'kind,ref_id,sent_on',
        ignoreDuplicates: true,
      })
      .select('id')
    if (!logged?.length) continue
    const subs = await subscriptionsOf(admin, [habit.user_id])
    sent += await sendAll(admin, subs, {
      title: `${habit.emoji} ${habit.name}`,
      body: '오늘 습관을 할 시간이에요.',
      url: '/todo',
      tag: `habit-${habit.id}`,
    })
  }
  return { due: due.length, sent }
}

async function subscriptionsOf(admin: SupabaseClient, userIds: string[]): Promise<Sub[]> {
  const { data, error } = await admin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').in('user_id', userIds)
  if (error) throw error
  return data as Sub[]
}

/** 기기마다 보낸다. 앱을 지웠거나 알림을 끈 기기(404·410)는 구독을 지운다 */
async function sendAll(admin: SupabaseClient, subs: Sub[], payload: Payload): Promise<number> {
  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 },
        )
        sent++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_subscriptions').delete().eq('id', s.id)
        else console.error('보내지 못함', status, e)
      }
    }),
  )
  return sent
}

/** 시간대 기준 오늘 날짜(yyyy-MM-dd), 요일(1=월~7=일), 자정부터 지난 분 */
function localNow(now: Date, timeZone: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  )
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) + 1
  return { date: `${p.year}-${p.month}-${p.day}`, weekday, minutes: Number(p.hour) * 60 + Number(p.minute) }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
