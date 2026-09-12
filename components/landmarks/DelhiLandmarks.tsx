"use client";

import { forwardRef } from "react";

interface LandmarkProps {
  className?: string;
}

export const IndiaGate = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <rect x="20" y="200" width="160" height="8" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="30" y="192" width="140" height="10" rx="2" fill="currentColor" opacity="0.4" />

      <rect x="35" y="70" width="22" height="122" fill="url(#ig-grad)" />
      <rect x="32" y="65" width="28" height="8" rx="1" fill="currentColor" opacity="0.85" />

      <rect x="143" y="70" width="22" height="122" fill="url(#ig-grad)" />
      <rect x="140" y="65" width="28" height="8" rx="1" fill="currentColor" opacity="0.85" />

      <path
        d="M57 73 Q100 20 143 73"
        stroke="currentColor"
        strokeWidth="14"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M57 73 Q100 30 143 73"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        opacity="0.5"
      />

      <path
        d="M57 192 Q100 120 143 192"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.45"
      />

      <rect x="85" y="16" width="30" height="7" rx="3" fill="currentColor" opacity="0.8" />
      <rect x="92" y="8" width="16" height="10" rx="2" fill="currentColor" opacity="0.9" />

      <line x1="57" y1="100" x2="143" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <line x1="57" y1="130" x2="143" y2="130" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <line x1="57" y1="160" x2="143" y2="160" stroke="currentColor" strokeWidth="2" opacity="0.35" />

      {/* INDIA GATE text */}
      <text x="100" y="215" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="serif" letterSpacing="3">INDIA GATE</text>
    </svg>
  )
);
IndiaGate.displayName = "IndiaGate";

export const QutubMinar = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 120 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="qm-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="248" rx="40" ry="6" fill="currentColor" opacity="0.3" />
      <rect x="30" y="240" width="60" height="10" rx="3" fill="currentColor" opacity="0.5" />

      <path
        d="M38 240 L48 60 Q60 50 72 60 L82 240Z"
        fill="url(#qm-grad)"
      />

      <ellipse cx="60" cy="200" rx="28" ry="4.5" fill="currentColor" opacity="0.7" />
      <ellipse cx="60" cy="160" rx="24" ry="4" fill="currentColor" opacity="0.7" />
      <ellipse cx="60" cy="120" rx="20" ry="3.5" fill="currentColor" opacity="0.7" />
      <ellipse cx="60" cy="85" rx="16" ry="3" fill="currentColor" opacity="0.7" />

      <path d="M52 60 Q60 28 68 60" fill="currentColor" opacity="0.9" />
      <circle cx="60" cy="26" r="5" fill="currentColor" opacity="0.8" />
      <line x1="60" y1="21" x2="60" y2="10" stroke="currentColor" strokeWidth="2.5" opacity="0.8" />

      <line x1="50" y1="240" x2="54" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="60" y1="240" x2="60" y2="55" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="70" y1="240" x2="66" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.3" />

      <text x="60" y="256" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="7" fontFamily="serif" letterSpacing="2">QUTUB MINAR</text>
    </svg>
  )
);
QutubMinar.displayName = "QutubMinar";

export const LotusTemple = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lt-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <ellipse cx="110" cy="168" rx="90" ry="10" fill="currentColor" opacity="0.2" />
      <ellipse cx="110" cy="160" rx="70" ry="8" fill="currentColor" opacity="0.3" />

      <path
        d="M110 28 Q95 78 90 128 Q110 140 130 128 Q125 78 110 28Z"
        fill="url(#lt-grad)"
      />

      <path
        d="M80 48 Q58 88 53 138 Q73 148 90 133 Q83 83 80 48Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M48 68 Q28 108 28 148 Q48 155 65 140 Q53 98 48 68Z"
        fill="currentColor"
        opacity="0.55"
      />

      <path
        d="M140 48 Q162 88 167 138 Q147 148 130 133 Q137 83 140 48Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M172 68 Q192 108 192 148 Q172 155 155 140 Q167 98 172 68Z"
        fill="currentColor"
        opacity="0.55"
      />

      <path d="M110 38 Q100 88 95 128" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <path d="M110 38 Q120 88 125 128" stroke="currentColor" strokeWidth="1" opacity="0.4" />

      <text x="110" y="178" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="7" fontFamily="serif" letterSpacing="2">LOTUS TEMPLE</text>
    </svg>
  )
);
LotusTemple.displayName = "LotusTemple";

export const RedFort = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rf-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <rect x="10" y="100" width="220" height="70" rx="2" fill="url(#rf-grad)" />

      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <rect key={i} x={15 + i * 20} y="88" width="14" height="16" rx="1" fill="currentColor" opacity="0.7" />
      ))}

      <path d="M90 170 Q120 108 150 170" stroke="currentColor" strokeWidth="5" fill="none" opacity="0.8" />
      <path d="M95 170 Q120 116 145 170" fill="currentColor" opacity="0.2" />

      <rect x="100" y="48" width="40" height="52" rx="2" fill="currentColor" opacity="0.75" />
      <path d="M100 53 Q120 28 140 53" fill="currentColor" opacity="0.8" />

      <rect x="25" y="63" width="25" height="37" rx="1" fill="currentColor" opacity="0.6" />
      <path d="M25 66 Q37.5 48 50 66" fill="currentColor" opacity="0.7" />

      <rect x="190" y="63" width="25" height="37" rx="1" fill="currentColor" opacity="0.6" />
      <path d="M190 66 Q202.5 48 215 66" fill="currentColor" opacity="0.7" />

      <line x1="120" y1="28" x2="120" y2="6" stroke="currentColor" strokeWidth="2" opacity="0.8" />
      <path d="M120 6 L138 13 L120 20Z" fill="currentColor" opacity="0.7" />

      <text x="120" y="176" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="7" fontFamily="serif" letterSpacing="3">RED FORT</text>
    </svg>
  )
);
RedFort.displayName = "RedFort";
