import React from 'react';

export function Logo({ className = "h-12" }: { className?: string }) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 400 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Motorbike Upper Silhouette - Simplified and Integrated */}
        <g className="fill-current text-foreground">
          {/* Handlebars */}
          <path 
            d="M100 65C85 65 75 50 65 50" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          <path 
            d="M200 65C215 65 225 50 235 50" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          
          {/* Grips */}
          <rect x="58" y="44" width="12" height="5" rx="1" fill="currentColor" />
          <rect x="230" y="44" width="12" height="5" rx="1" fill="currentColor" />
          
          {/* Helmet/Head Unit */}
          <path d="M125 50C125 35 135 25 150 25C165 25 175 35 175 50L170 65C170 65 150 70 130 65L125 50Z" fill="currentColor" />
          
          {/* Forks & Light */}
          <rect x="135" y="65" width="4" height="25" rx="1" fill="currentColor" />
          <rect x="160" y="65" width="4" height="25" rx="1" fill="currentColor" />
          <circle cx="150" cy="75" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="150" cy="75" r="3" fill="currentColor" />
        </g>

        {/* The Signature Leaf - Vibrant Orange */}
        <path 
          d="M245 45C255 45 285 20 295 15C280 35 260 55 245 45Z" 
          fill="hsl(24 100% 50%)" 
        />
        <path 
          d="M245 45C260 35 275 25 290 18" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />

        {/* Main Brand Text Group */}
        <g className="font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {/* "u-" in Foreground */}
          <text x="10" y="115" fontSize="75" fill="currentColor" className="text-foreground">u-</text>
          
          {/* "b" in Foreground */}
          <text x="110" y="115" fontSize="75" fill="currentColor" className="text-foreground">b</text>
          
          {/* Tire "i" - Orange Hub and Hub-cap */}
          <g>
            <circle cx="185" cy="102" r="24" stroke="currentColor" strokeWidth="8" fill="none" className="text-foreground" />
            <circle cx="185" cy="102" r="7" fill="hsl(24 100% 50%)" />
            <path 
              d="M185 78V84M185 120V126M161 102H167M203 102H209" 
              stroke="hsl(24 100% 50%)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />
          </g>
          
          {/* "ke" in Foreground */}
          <text x="225" y="115" fontSize="75" fill="currentColor" className="text-foreground">ke</text>
        </g>

        {/* Dynamic Speed/Motion Lines - Orange */}
        <g stroke="hsl(24 100% 50%)" strokeWidth="4" strokeLinecap="round">
          <path d="M315 100H355" />
          <path d="M315 112H350" />
          <path d="M315 124H340" />
        </g>
      </svg>
    </div>
  );
}
