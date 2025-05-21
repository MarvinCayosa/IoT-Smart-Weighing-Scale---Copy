import React from 'react';

const WeighingScale = ({ weight, isActive = false }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Platform */}
        <rect
          x="40"
          y="140"
          width="120"
          height="20"
          rx="10"
          fill="#2A2A2A"
          stroke="#D3A2FF"
          strokeWidth="2"
        />
        
        {/* Scale Platform */}
        <rect
          x="50"
          y="100"
          width="100"
          height="40"
          rx="5"
          fill="#1A1A1A"
          stroke="#D3A2FF"
          strokeWidth="2"
        />
        
        {/* Display Screen */}
        <rect
          x="60"
          y="110"
          width="80"
          height="20"
          rx="3"
          fill="#000000"
          stroke="#D3A2FF"
          strokeWidth="1"
        />
        
        {/* Weight Display */}
        <text
          x="100"
          y="125"
          textAnchor="middle"
          fill="#D3A2FF"
          fontSize="12"
          fontFamily="monospace"
        >
          {weight} kg
        </text>
        
        {/* Decorative Elements */}
        <circle
          cx="100"
          cy="80"
          r="5"
          fill={isActive ? "#D3A2FF" : "#2A2A2A"}
          stroke="#D3A2FF"
          strokeWidth="1"
        />
        
        {/* Connection Lines */}
        <line
          x1="100"
          y1="80"
          x2="100"
          y2="100"
          stroke="#D3A2FF"
          strokeWidth="1"
        />
        
        {/* Side Supports */}
        <rect
          x="40"
          y="80"
          width="10"
          height="60"
          fill="#2A2A2A"
          stroke="#D3A2FF"
          strokeWidth="1"
        />
        <rect
          x="150"
          y="80"
          width="10"
          height="60"
          fill="#2A2A2A"
          stroke="#D3A2FF"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};

export default WeighingScale; 