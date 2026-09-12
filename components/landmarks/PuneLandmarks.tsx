"use client";

import { forwardRef } from "react";

interface LandmarkProps {
  className?: string;
}

export const ShaniwarWada = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sw-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect x="10" y="180" width="220" height="10" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="20" y="90" width="200" height="90" fill="url(#sw-grad)" />

      <path
        d="M80 180 L80 110 Q120 58 160 110 L160 180"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M85 180 L85 112 Q120 66 155 112 L155 180"
        fill="currentColor"
        opacity="0.2"
      />

      <line x1="120" y1="70" x2="120" y2="50" stroke="currentColor" strokeWidth="2.5" opacity="0.8" />
      <circle cx="120" cy="47" r="4" fill="currentColor" opacity="0.7" />

      <path d="M35 128 Q45 115 55 128 L55 152 L35 152Z" fill="currentColor" opacity="0.35" />
      <path d="M185 128 Q195 115 205 128 L205 152 L185 152Z" fill="currentColor" opacity="0.35" />

      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <rect key={i} x={25 + i * 20} y="80" width="12" height="12" rx="1" fill="currentColor" opacity="0.65" />
      ))}

      <rect x="15" y="68" width="18" height="112" fill="currentColor" opacity="0.7" />
      <path d="M15 71 Q24 55 33 71" fill="currentColor" opacity="0.75" />

      <rect x="207" y="68" width="18" height="112" fill="currentColor" opacity="0.7" />
      <path d="M207 71 Q216 55 225 71" fill="currentColor" opacity="0.75" />

      <line x1="20" y1="118" x2="80" y2="118" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="160" y1="118" x2="220" y2="118" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />

      <text x="120" y="196" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="7" fontFamily="serif" letterSpacing="2">SHANIWAR WADA</text>
    </svg>
  )
);
ShaniwarWada.displayName = "ShaniwarWada";

export const AgaKhanPalace = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 260 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ak-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <rect x="10" y="160" width="240" height="10" rx="2" fill="currentColor" opacity="0.35" />
      <rect x="30" y="80" width="200" height="80" rx="2" fill="url(#ak-grad)" />

      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i}>
          <path
            d={`M${48 + i * 26} 160 L${48 + i * 26} 108 Q${61 + i * 26} 92 ${74 + i * 26} 108 L${74 + i * 26} 160`}
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            opacity="0.6"
          />
        </g>
      ))}

      <rect x="110" y="42" width="40" height="42" rx="2" fill="currentColor" opacity="0.7" />
      <path d="M108 46 Q130 22 152 46" fill="currentColor" opacity="0.75" />

      <rect x="125" y="28" width="10" height="18" rx="1" fill="currentColor" opacity="0.7" />
      <circle cx="130" cy="24" r="6" fill="currentColor" opacity="0.6" />

      <line x1="30" y1="80" x2="230" y2="80" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
      <line x1="28" y1="76" x2="232" y2="76" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />

      <rect x="15" y="88" width="20" height="72" fill="currentColor" opacity="0.45" />
      <rect x="225" y="88" width="20" height="72" fill="currentColor" opacity="0.45" />

      <text x="130" y="176" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="7" fontFamily="serif" letterSpacing="2">AGA KHAN PALACE</text>
    </svg>
  )
);
AgaKhanPalace.displayName = "AgaKhanPalace";

export const SinhagadFort = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 260 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sf-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <path
        d="M0 200 L40 138 L80 158 L130 78 L180 148 L220 128 L260 200Z"
        fill="url(#sf-grad)"
      />
      <path
        d="M20 200 L60 148 L100 163 L130 98 L160 153 L200 138 L240 200Z"
        fill="currentColor"
        opacity="0.2"
      />

      <path
        d="M70 153 L70 128 L90 128 L90 122 L110 122 L110 118 L150 118 L150 122 L170 122 L170 128 L190 128 L190 153"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.8"
      />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={80 + i * 18} y="110" width="10" height="10" rx="1" fill="currentColor" opacity="0.6" />
      ))}

      <path d="M118 153 Q130 132 142 153" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.65" />

      <rect x="72" y="108" width="16" height="27" fill="currentColor" opacity="0.7" />
      <path d="M70 110 Q80 97 90 110" fill="currentColor" opacity="0.7" />

      <line x1="80" y1="97" x2="80" y2="76" stroke="currentColor" strokeWidth="2" opacity="0.8" />
      <path d="M80 76 L94 82 L80 88Z" fill="currentColor" opacity="0.7" />

      <path
        d="M50 178 L65 163 L75 153"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 3"
        opacity="0.45"
      />

      <text x="130" y="196" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="7" fontFamily="serif" letterSpacing="2">SINHAGAD FORT</text>
    </svg>
  )
);
SinhagadFort.displayName = "SinhagadFort";

export const ParvatiHill = forwardRef<SVGSVGElement, LandmarkProps>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ph-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <path d="M0 200 Q50 118 100 98 Q150 118 200 200Z" fill="url(#ph-grad)" />

      <path
        d="M60 178 L70 163 L80 153 L88 138 L95 126 L100 116"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="5 3"
        opacity="0.5"
      />

      <rect x="80" y="78" width="40" height="27" rx="1" fill="currentColor" opacity="0.7" />

      <path d="M80 80 Q100 36 120 80" fill="currentColor" opacity="0.8" />

      <line x1="100" y1="38" x2="100" y2="22" stroke="currentColor" strokeWidth="2.5" opacity="0.8" />
      <circle cx="100" cy="19" r="5" fill="currentColor" opacity="0.7" />

      <line x1="88" y1="78" x2="88" y2="105" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
      <line x1="100" y1="78" x2="100" y2="105" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
      <line x1="112" y1="78" x2="112" y2="105" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />

      <rect x="75" y="105" width="50" height="7" rx="1" fill="currentColor" opacity="0.55" />

      <text x="100" y="196" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="7" fontFamily="serif" letterSpacing="2">PARVATI HILL</text>
    </svg>
  )
);
ParvatiHill.displayName = "ParvatiHill";
