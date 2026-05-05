import React from 'react';

export function Logo({ className = "h-12" }: { className?: string }) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 350 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Motorbike Upper Silhouette */}
        <g className="fill-current text-foreground">
          {/* Handlebars */}
          <path 
            d="M100 65C85 65 75 50 65 50" 
            stroke="currentColor" 
            strokeWidth="5" 
            strokeLinecap="round" 
          />
          <path 
            d="M200 65C215 65 225 50 235 50" 
            stroke="currentColor" 
            strokeWidth="5" 
            strokeLinecap="round" 
          />
          
          {/* Grips */}
          <rect x="58" y="44" width="12" height="6" rx="1" fill="currentColor" />
          <rect x="230" y="44" width="12" height="6" rx="1" fill="currentColor" />
          
          {/* Helmet/Head Unit */}
          <path d="M125 50C125 35 135 25 150 25C165 25 175 35 175 50L170 65C170 65 150 70 130 65L125 50Z" fill="currentColor" />
          
          {/* Forks & Light Assembly */}
          <rect x="135" y="65" width="5" height="30" rx="1" fill="currentColor" />
          <rect x="160" y="65" width="5" height="30" rx="1" fill="currentColor" />
          <circle cx="150" cy="75" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="150" cy="75" r="4" fill="currentColor" />
        </g>

        {/* The Leaf - Now themed Orange */}
        <path 
          d="M245 45C255 45 285 20 295 15C280 35 260 55 245 45Z" 
          fill="hsl(24 100% 50%)" 
        />
        <path 
          d="M245 45C260 35 275 25 290 18" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />

        {/* Text Group */}
        <g className="fill-current text-foreground font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {/* "u-" */}
          <text x="10" y="115" fontSize="70">u-</text>
          
          {/* "b" */}
          <text x="100" y="115" fontSize="70">b</text>
          
          {/* Tire "i" */}
          <g>
            <circle cx="172" cy="105" r="22" stroke="currentColor" strokeWidth="8" fill="none" />
            <circle cx="172" cy="105" r="6" fill="currentColor" />
            <path d="M172 83V88M172 122V127M150 105H155M189 105H194" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </g>
          
          {/* "ke" */}
          <text x="210" y="115" fontSize="70">ke</text>
        </g>

        {/* Speed Lines */}
        <g stroke="hsl(24 100% 50%)" strokeWidth="3" strokeLinecap="round">
          <path d="M300 100H335" />
          <path d="M300 110H330" />
          <path d="M300 120H325" />
        </g>
      </svg>
    </div>
  );
}
