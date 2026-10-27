/**
 * OneSignal — أداة إرسال الإشعارات الفورية من الخادم
 *
 * يستخدم لإرسال إشعار لكل المشتركين عند:
 * - إضافة قناة جديدة
 * - إضافة مباراة جديدة
 * - إرسال إشعار يدوي من لوحة الإدارة
 */

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";

interface SendNotificationParams {
  /** عنوان الإشعار */
  headings?: { ar: string; en?: string };
  /** نص الإشعار */
  contents: { ar: string; en?: string };
  /** رابط يفتح عند النقر على الإشعار */
  url?: string;
  /** أيقونة الإشعار (URL) */
  big_picture?: string;
  /** معرف فريد لتجنب التكرار */
  android_group?: string;
}

/**
 * يرسل إشعارًا فوريًا لكل المشتركين في OneSignal.
 * يستخدم REST API من الخادم (المفتاح السري).
 */
export async function sendPushNotification(params: SendNotificationParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return {
      success: false,
      error: "OneSignal غير مُعد — أضف NEXT_PUBLIC_ONESIGNAL_APP_ID و ONESIGNAL_REST_API_KEY في Vercel Environment Variables",
    };
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["Subscribed Users"],
        headings: params.headings || { ar: "WazaNI TV", en: "WazaNI TV" },
        contents: params.contents,
        url: params.url || "https://wazani-tv-live.vercel.app",
        chrome_web_icon: "https://wazani-tv-live.vercel.app/icon-192.png",
        firefox_icon: "https://wazani-tv-live.vercel.app/icon-192.png",
        android_group: params.android_group,
        priority: 10,
        ttl: 86400,
      }),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      return { success: true, id: data.id };
    }

    // إذا لم يوجد مشتركين، اعتبره نجاحًا (ليس خطأ)
    if (data.errors?.[0]?.includes("No subscribers")) {
      return { success: true, id: "no-subscribers", error: "لا يوجد مشتركون بعد — لكن تم حفظ الإشعار" };
    }

    return { success: false, error: data.errors?.[0] || `فشل إرسال الإشعار (HTTP ${response.status})` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "خطأ في الاتصال بـ OneSignal",
    };
  }
}

/**
 * إشعار مختصر عند إضافة قناة جديدة
 */
export async function notifyNewChannel(channelName: string): Promise<void> {
  await sendPushNotification({
    headings: { ar: "قناة جديدة على WazaNI TV 📺", en: "New Channel on WazaNI TV 📺" },
    contents: {
      ar: `تمت إضافة "${channelName}" — شاهد الآن!`,
      en: `"${channelName}" has been added — watch now!`,
    },
    url: "https://wazani-tv-live.vercel.app",
    android_group: "new_channel",
  });
}

/**
 * إشعار مختصر عند إضافة مباراة جديدة
 */
export async function notifyNewMatch(homeName: string, awayName: string): Promise<void> {
  await sendPushNotification({
    headings: { ar: "مباراة جديدة على WazaNI TV ⚽", en: "New Match on WazaNI TV ⚽" },
    contents: {
      ar: `${homeName} ضد ${awayName} — لا تفوّت المباراة!`,
      en: `${homeName} vs ${awayName} — don't miss it!`,
    },
    url: "https://wazani-tv-live.vercel.app",
    android_group: "new_match",
  });
}
