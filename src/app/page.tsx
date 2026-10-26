"use client";

import * as React from "react";

/**
 * نسخة مبسطة جدًا من الصفحة لتحديد سبب React Error #130.
 * إذا عملت هذه النسخة، فالمشكلة في أحد المكونات المستوردة.
 * إذا فشلت أيضًا، فالمشكلة في layout.tsx أو المكتبات.
 */
export default function Home() {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", direction: "rtl" }}>
      <h1 style={{ color: "#0b6e4f" }}>WazaNI TV</h1>
      <p>الصفحة تعمل! المشكلة في أحد المكونات.</p>
    </div>
  );
}
