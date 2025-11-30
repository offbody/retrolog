import React from 'react';

export const PixelWalkingMen: React.FC = () => {
  return (
    <div className="w-full h-[100px] bg-r-card-light dark:bg-r-card-dark clip-corner flex items-center justify-center overflow-hidden relative border-b border-black/10 dark:border-white/10">
      
      {/* Pixel Grid Pattern for texture (Optional, subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
      </div>

      <div className="w-full h-full flex items-center relative">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* A Single Pixel Man Definition (8x12 grid roughly) */}
            <g id="pixel-man">
               {/* Head */}
               <rect x="30" y="0" width="20" height="20" className="fill-black dark:fill-white" />
               {/* Body */}
               <rect x="20" y="25" width="40" height="35" className="fill-black dark:fill-white" />
               {/* Left Arm */}
               <rect x="0" y="25" width="10" height="30" className="fill-black dark:fill-white opacity-80">
                 <animateTransform attributeName="transform" type="rotate" values="-10 5 25; 10 5 25; -10 5 25" dur="0.8s" repeatCount="indefinite" />
               </rect>
               {/* Right Arm */}
               <rect x="70" y="25" width="10" height="30" className="fill-black dark:fill-white opacity-80">
                 <animateTransform attributeName="transform" type="rotate" values="10 75 25; -10 75 25; 10 75 25" dur="0.8s" repeatCount="indefinite" />
               </rect>
               
               {/* Left Leg */}
               <g>
                 <rect x="25" y="65" width="12" height="25" className="fill-black dark:fill-white">
                    <animate attributeName="height" values="25; 15; 25" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="y" values="65; 60; 65" dur="0.8s" repeatCount="indefinite" />
                 </rect>
               </g>
               {/* Right Leg */}
               <g>
                 <rect x="43" y="65" width="12" height="25" className="fill-black dark:fill-white">
                    <animate attributeName="height" values="15; 25; 15" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="y" values="60; 65; 60" dur="0.8s" repeatCount="indefinite" />
                 </rect>
               </g>
            </g>
          </defs>

          {/* The Crowd Moving */}
          <g>
             {/* We create a long strip of men moving left */}
             <animateTransform attributeName="transform" type="translate" from="1000 0" to="-1000 0" dur="15s" repeatCount="indefinite" />
             
             {/* Row of men */}
             <use href="#pixel-man" x="0" y="10" transform="scale(0.6)" />
             <use href="#pixel-man" x="200" y="10" transform="scale(0.6)" />
             <use href="#pixel-man" x="400" y="10" transform="scale(0.6)" />
             <use href="#pixel-man" x="600" y="10" transform="scale(0.6)" />
             <use href="#pixel-man" x="800" y="10" transform="scale(0.6)" />
             <use href="#pixel-man" x="1000" y="10" transform="scale(0.6)" />
             <use href="#pixel-man" x="1200" y="10" transform="scale(0.6)" />
          </g>
          
          {/* A second layer moving slower for depth */}
          <g opacity="0.3">
             <animateTransform attributeName="transform" type="translate" from="1200 0" to="-800 0" dur="25s" repeatCount="indefinite" />
             <use href="#pixel-man" x="100" y="20" transform="scale(0.4)" />
             <use href="#pixel-man" x="350" y="20" transform="scale(0.4)" />
             <use href="#pixel-man" x="650" y="20" transform="scale(0.4)" />
             <use href="#pixel-man" x="950" y="20" transform="scale(0.4)" />
          </g>

        </svg>
      </div>
    </div>
  );
};