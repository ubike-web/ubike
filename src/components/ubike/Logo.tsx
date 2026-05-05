import React from 'react';

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <svg
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* "u-" */}
        <text
          x="10"
          y="45"
          className="fill-current font-bold"
          style={{ fontSize: '40px', fontFamily: 'Poppins, sans-serif' }}
        >
          u-
        </text>
        {/* "b" */}
        <text
          x="60"
          y="45"
          className="fill-current font-bold"
          style={{ fontSize: '40px', fontFamily: 'Poppins, sans-serif' }}
        >
          b
        </text>
        {/* Tire "i" */}
        <circle cx="95" cy="40" r="10" stroke="currentColor" strokeWidth="4" />
        <circle cx="95" cy="40" r="3" fill="currentColor" />
        {/* "ke" */}
        <text
          x="115"
          y="45"
          className="fill-current font-bold"
          style={{ fontSize: '40px', fontFamily: 'Poppins, sans-serif' }}
        >
          ke
        </text>
        {/* Subtle leaf on "b" handle (just symbolic) */}
        <path
          d="M75 15C75 15 85 10 90 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="90" cy="20" r="1.5" fill="#BF9340" />
      </svg>
    </div>
  );
}
