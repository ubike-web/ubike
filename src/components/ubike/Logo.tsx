
import React from 'react';

export function Logo({ className = "h-12" }: { className?: string }) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Motorbike Front View */}
        <g className="fill-current">
          {/* Handlebars */}
          <path 
            d="M170 85C150 85 130 75 120 75M330 85C350 85 370 75 380 75" 
            stroke="currentColor" 
            strokeWidth="6" 
            strokeLinecap="round" 
          />
          {/* Grips */}
          <rect x="110" y="70" width="15" height="8" rx="2" fill="currentColor" />
          <rect x="375" y="70" width="15" height="8" rx="2" fill="currentColor" />
          
          {/* Headlight Housing */}
          <path d="M225 70C225 55 235 45 250 45C265 45 275 55 275 70L270 85C270 85 250 90 230 85L225 70Z" fill="currentColor" />
          <circle cx="250" cy="78" r="10" fill="white" />
          <circle cx="250" cy="78" r="6" fill="currentColor" />
          
          {/* Forks */}
          <rect x="235" y="85" width="6" height="40" rx="1" fill="currentColor" />
          <rect x="259" y="85" width="6" height="40" rx="1" fill="currentColor" />
          
          {/* Front Tire with Tread Pattern */}
          <g>
            <rect x="242" y="115" width="16" height="65" rx="4" fill="currentColor" />
            {/* Tread Pattern */}
            <path d="M244 125L250 120L256 125" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M244 135L250 130L256 135" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M244 145L250 140L256 145" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M244 155L250 150L256 155" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M244 165L250 160L256 165" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>

        {/* The Signature Leaf */}
        <g transform="translate(385, 55) rotate(-15)">
          <path 
            d="M0 20C10 20 40 -5 50 -10C35 15 15 35 0 20Z" 
            fill="#79B933" 
          />
          <path 
            d="M0 20C15 12 30 5 45 -2" 
            stroke="white" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
        </g>

        {/* Text Group "u-bike" */}
        <g className="font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <text x="50" y="165" fontSize="80" fill="currentColor">u</text>
          <text x="115" y="165" fontSize="80" fill="currentColor">-</text>
          <text x="165" y="165" fontSize="80" fill="currentColor">b</text>
          <text x="280" y="165" fontSize="80" fill="currentColor">i</text>
          <text x="315" y="165" fontSize="80" fill="currentColor">k</text>
          <text x="370" y="165" fontSize="80" fill="currentColor">e</text>
        </g>

        {/* Motion Lines */}
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path d="M430 145H465" />
          <path d="M430 157H460" />
          <path d="M430 169H450" />
        </g>
      </svg>
    </div>
  );
}
