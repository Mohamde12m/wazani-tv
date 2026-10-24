/**
 * نظام تذكير بالمباريات — يعمل في المتصفح فقط (لا خادم مطلوب).
 *
 * - يخزّن المباريات المراد التذكير بها في localStorage
 * - يفحص كل دقيقة المباريات القادمة
 * - يرسل إشعارًا قبل 5 دقائق من بدء المباراة
 * - يستخدم Notifications API (يتطلب إذن المستخدم)
 */

const STORAGE_KEY = "wazani_reminders";
const NOTIFY_BEFORE_MS = 5 * 60 * 1000; // 5 دقائق قبل المباراة
const CHECK_INTERVAL_MS = 60 * 1000; // كل دقيقة

export interface Reminder {
  matchId: string;
  homeName: string;
  awayName: string;
  kickoff: string; // ISO string
  notified: boolean;
}

function loadReminders(): Reminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveReminders(reminders: Reminder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    // noop
  }
}

/**
 * أضف مباراة للتذكير.
 */
export function addReminder(match: {
  id: string;
  homeName: string;
  awayName: string;
  kickoff: string;
}): void {
  const reminders = loadReminders();
  if (reminders.some((r) => r.matchId === match.id)) return;
  reminders.push({
    matchId: match.id,
    homeName: match.homeName,
    awayName: match.awayName,
    kickoff: match.kickoff,
    notified: false,
  });
  saveReminders(reminders);
}

/**
 * أزل مباراة من التذكير.
 */
export function removeReminder(matchId: string): void {
  const reminders = loadReminders().filter((r) => r.matchId !== matchId);
  saveReminders(reminders);
}

/**
 * تحقق لو مباراة في قائمة التذكير.
 */
export function hasReminder(matchId: string): boolean {
  return loadReminders().some((r) => r.matchId === matchId);
}

/**
 * اطلب إذن الإشعارات من المستخدم.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * أرسل إشعارًا للمستخدم.
 */
function sendNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "wazani-match",
      requireInteraction: false,
    });
  } catch {
    // noop
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * ابدأ فاحص المباريات — يفحص كل دقيقة.
 * يجب استدعاؤها مرة واحدة عند تحميل التطبيق.
 */
export function startReminderChecker(): void {
  if (typeof window === "undefined") return;
  if (intervalId) return; // already running

  const check = () => {
    const reminders = loadReminders();
    const now = Date.now();
    let updated = false;

    for (const r of reminders) {
      if (r.notified) continue;
      const kickoff = new Date(r.kickoff).getTime();
      const diff = kickoff - now;
      // ذكّر قبل 5 دقائق (وبعد بدء المباراة بقليل لو فات الوقت)
      if (diff <= NOTIFY_BEFORE_MS && diff > -60 * 1000) {
        sendNotification(
          "⚽ مباراة تبدأ قريبًا!",
          `${r.homeName} × ${r.awayName} — تبدأ خلال ${Math.max(1, Math.round(diff / 60000))} دقيقة`,
        );
        r.notified = true;
        updated = true;
      }
    }

    if (updated) saveReminders(reminders);
  };

  // افحص فورًا ثم كل دقيقة
  check();
  intervalId = setInterval(check, CHECK_INTERVAL_MS);
}

/**
 * أوقف الفاحص (عند تسجيل الخروج مثلًا).
 */
export function stopReminderChecker(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
