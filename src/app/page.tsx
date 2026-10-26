"use client";

import * as React from "react";
import { AppShell } from "@/components/shared/app-shell";

/**
 * اختبار 2: إضافة AppShell فقط — لمعرفة إذا كان السبب في AppShell أو AdSlot
 */
export default function Home() {
  return (
    <AppShell>
      <div style={{ padding: 20, fontFamily: "sans-serif", direction: "rtl" }}>
        <h1 style={{ color: "#0b6e4f" }}>WazaNI TV</h1>
        <p>اختبار AppShell — إذا ظهرت هذه الصفحة، فالمشكلة في HomeView.</p>
      </div>
    </AppShell>
  );
}
