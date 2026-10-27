"use client";

import * as React from "react";

/**
 * مكوّن OneSignal — يُحمّل في المتصفح فقط (client-side)
 * يسجل OneSignal SDK + يهيئه للإشعارات الفورية
 */
export function OneSignalProvider() {
  React.useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) {
      console.warn("[OneSignal] App ID غير مُعد — تخطي التهيئة");
      return;
    }

    // تحقق إذا OneSignal محمّل بالفعل
    if (typeof window === "undefined") return;

    // أنشئ عنصر script لتحميل OneSignal SDK
    const existingScript = document.getElementById("onesignal-sdk");
    if (existingScript) return; // محمّل بالفعل

    const script = document.createElement("script");
    script.id = "onesignal-sdk";
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      // بعد تحميل SDK، هيّئ OneSignal
      const OneSignal = (window as any).OneSignal;
      if (!OneSignal) return;

      OneSignal.push(function () {
        try {
          OneSignal.init({
            appId: appId,
            notifyTitle: "WazaNI TV",
            notifyButton: {
              enable: true,
              showCredit: false,
              text: {
                "dialog.main.button.subscribe": "اشترك في الإشعارات",
                "dialog.main.button.unsubscribe": "إلغاء الاشتراك",
                "dialog.main.title": "إشعارات WazaNI TV",
                "dialog.main.message":
                  "اشترك لتصلك إشعارات القنوات والمباريات الجديدة",
                "dialog.blocked.title": "إلغاء حظر الإشعارات",
                "dialog.blocked.message": "اتبع التعليمات لتفعيل الإشعارات",
              },
              colors: {
                "circle.background": "#0b6e4f",
                "circle.foreground": "white",
                "badge.background": "#c9962e",
                "badge.foreground": "white",
                "badge.bordercolor": "white",
                "pulse.color": "#0b6e4f",
                "dialog.button.background.hovering": "#0b6e4f",
                "dialog.button.background.active": "#0b6e4f",
                "dialog.button.background": "#0b6e4f",
                "dialog.button.foreground": "white",
              },
              size: "medium",
              position: "bottom-left",
            },
            welcomeNotification: {
              title: "WazaNI TV",
              message:
                "شكرًا لاشتراكك! ستصلك إشعارات القنوات والمباريات الجديدة.",
            },
            promptOptions: {
              slidedown: {
                prompts: [
                  {
                    type: "push",
                    autoPrompt: true,
                    text: {
                      headline: "اشترك في إشعارات WazaNI TV",
                      body: "كن أول من يعرف عن القنوات والمباريات الجديدة",
                      acceptButton: "اشترك",
                      cancelButton: "لا، شكرًا",
                    },
                    delay: {
                      pageViews: 1,
                      timeDelay: 10,
                    },
                  },
                ],
              },
            },
          });
        } catch (e) {
          console.error("[OneSignal] فشل التهيئة:", e);
        }
      });
    };

    script.onerror = () => {
      console.warn("[OneSignal] فشل تحميل SDK");
    };

    document.head.appendChild(script);

    return () => {
      // تنظيف عند unmount (لكن لا نحذف SDK لأنه قد يكون مستخدمًا)
    };
  }, []);

  return null;
}
