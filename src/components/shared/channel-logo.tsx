"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/img";

export function ChannelLogo({
  src,
  name,
  className,
  size = 56,
}: {
  src?: string | null;
  name: string;
  className?: string;
  size?: number;
}) {
  const [error, setError] = React.useState(false);
  const show = src && !error;
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-light/20 to-emerald/10 ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {show ? (
        <img
          src={imgUrl(src)}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-bold text-emerald"
          style={{ fontSize: size * 0.32 }}
        >
          {name.trim().slice(0, 1)}
        </span>
      )}
    </div>
  );
}
