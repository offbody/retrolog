
import React, { useRef, useEffect } from 'react';

interface Figure {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  state: 'walk' | 'idle';
  timer: number;
  variant: number; // To slightly vary height/style
  chatTimer: number; // Random offset for chat bubbles
}

export const PixelCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale factor: 1 logical pixel = 4 screen pixels
  const PIXEL_SCALE = 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crucial for pixel art look
    ctx.imageSmoothingEnabled = false;

    let figures: Figure[] = [];
    let skyline: { x: number, w: number, h: number }[] = [];
    let animationId: number;

    // Initialize figures based on low-res width
    const initFigures = (w: number, h: number) => {
        const count = Math.max(3, Math.floor(w / 25)); // Density adjusted
        figures = [];
        for(let i = 0; i < count; i++) {
            figures.push({
                x: Math.random() * w,
                y: h - 2, // Ground level in low-res coords
                speed: 0.15 + Math.random() * 0.25,
                direction: Math.random() > 0.5 ? 1 : -1,
                state: Math.random() > 0.6 ? 'idle' : 'walk',
                timer: Math.random() * 200,
                variant: Math.floor(Math.random() * 3),
                chatTimer: Math.random() * 10000
            });
        }
    };

    // Generate Random City Skyline (Static Background) - CENTERED
    const initSkyline = (w: number, h: number) => {
        skyline = [];
        
        // Margins in logical pixels (Reduced to 4px as requested)
        const margin = 4; 
        
        // Vertical constraints
        const maxBuildingHeight = h - (margin * 2);
        
        // Horizontal constraints
        const usableWidth = w - (margin * 2);

        // Temporary array to store buildings relative to group start
        const buildings: { w: number, h: number }[] = [];
        let currentWidth = 0;

        // Generate buildings
        while(currentWidth < usableWidth) {
            const buildingW = 4 + Math.floor(Math.random() * 12);
            
            // If adding this building exceeds usable width, stop loop
            if (currentWidth + buildingW > usableWidth) {
                break;
            }

            // Height logic: tall buildings to fill the space
            // Min height is 60% of max to ensure "wall" look
            const minH = maxBuildingHeight * 0.6;
            const buildingH = minH + Math.random() * (maxBuildingHeight - minH);

            buildings.push({ w: buildingW, h: buildingH });
            currentWidth += buildingW + 1; // +1 for 1px gap
        }

        // Remove the trailing gap from the width calculation for centering
        if (buildings.length > 0) {
            currentWidth -= 1;
        }

        // Calculate Start X to perfectly Center the Skyline
        // Math.floor ensures we snap to pixel grid to avoid sub-pixel blurring
        const startX = Math.floor((w - currentWidth) / 2);

        let xPointer = startX;
        buildings.forEach(b => {
            skyline.push({ 
                x: xPointer, 
                w: b.w, 
                h: b.h 
            });
            xPointer += b.w + 1;
        });
    };

    const resize = () => {
        // Set internal resolution to be small
        canvas.width = Math.ceil(container.clientWidth / PIXEL_SCALE);
        canvas.height = Math.ceil(container.clientHeight / PIXEL_SCALE);
        ctx.imageSmoothingEnabled = false; // Reset on resize
        initFigures(canvas.width, canvas.height);
        initSkyline(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    // Helper to draw a pixel point
    const drawPixel = (x: number, y: number) => {
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    // Helper to draw a line of pixels (Bresenham-ish)
    const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
        x0 = Math.round(x0); y0 = Math.round(y0);
        x1 = Math.round(x1); y1 = Math.round(y1);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while(true) {
            drawPixel(x0, y0);
            if ((x0 === x1) && (y0 === y1)) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    };

    const drawCity = (w: number, h: number) => {
        const isDark = document.documentElement.classList.contains('dark');
        
        // 1. Draw Faint Grid (Authentic Overlay)
        // Draw a dot every 2 pixels to create a fine grid
        // Extremely subtle opacity (0.02)
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';

        for(let gx = 0; gx < w; gx += 2) {
             for(let gy = 0; gy < h; gy += 2) {
                 ctx.fillRect(gx, gy, 1, 1);
             }
        }

        // 2. Draw Skyline
        // Semi-transparent blocks to let the background color show through but darker/lighter
        // Dark Mode: White buildings (faint)
        // Light Mode: Black buildings (faint)
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        const bottomMargin = 4; // Defined margin (Reduced to 4px)

        skyline.forEach(b => {
            // Draw from bottom margin up
            // Y position = Canvas Height - Bottom Margin - Building Height
            const by = h - bottomMargin - b.h;
            
            ctx.fillRect(Math.round(b.x), Math.round(by), Math.round(b.w), Math.round(b.h));
            
            // Random "windows" (static noise on buildings)
            if (Math.random() > 0.99) {
                 // Tiny flicker
                 const prevFill = ctx.fillStyle;
                 ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
                 ctx.fillRect(Math.round(b.x + 2), Math.round(by + 2), 1, 1);
                 // Restore fill style
                 ctx.fillStyle = prevFill;
            }
        });
    };

    const drawFigure = (f: Figure, time: number) => {
        const isDark = document.documentElement.classList.contains('dark');
        
        // 1. Draw Figure (High Contrast)
        // Light Mode: Black
        // Dark Mode: White
        ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';

        const animOffset = (f.state === 'walk' && Math.floor(time / 200) % 2 === 0) ? 1 : 0;
        
        // Position in low-res space
        let px = Math.round(f.x);
        let py = Math.round(f.y);

        // Height variation (Reduced base height from 5 to 3 for ~20% smaller look)
        const h = 3 + f.variant; 

        // HEAD (Kept 3px wide for readability, but positioned lower relative to reduced body)
        const headY = py - h - 2;
        ctx.fillRect(px - 1, headY, 3, 1); // Top cap
        ctx.fillRect(px - 1, headY + 1, 3, 1); // Face
        
        // BODY (Shorter)
        drawLine(px, headY + 2, px, py - 2);

        // ARMS (Shorter)
        const armY = headY + 2;
        if (f.state === 'walk') {
            // Swing arms
            const swing = animOffset ? 2 : -2;
            drawLine(px, armY, px - (f.direction * swing), armY + 2);
            drawLine(px, armY, px + (f.direction * swing), armY + 2);
        } else {
            // Idle arms down
            drawLine(px, armY, px - 1, armY + 2);
            drawLine(px, armY, px + 1, armY + 2);
        }

        // LEGS
        const legY = py - 2;
        if (f.state === 'walk') {
            const stride = animOffset ? 2 : 0;
            drawLine(px, legY, px - 2 + stride, py);
            drawLine(px, legY, px + 2 - stride, py);
        } else {
            drawLine(px, legY, px - 1, py);
            drawLine(px, legY, px + 1, py);
        }

        // 2. Draw Chat Bubble (High Contrast, Scaled Down)
        if (f.state === 'idle') {
            // Bubble visibility cycle
            const cycle = Math.floor((time + f.chatTimer) / 2000) % 3;
            if (cycle === 0) {
                // Ensure bubble uses same color as figure
                ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
                
                // Reduced Bubble Size (was 11x7)
                const bw = 9; 
                const bh = 5;
                
                // Position bubble slightly to the right and above head
                // Adjusted offset for smaller head size
                const bx = px + 2; 
                const by = headY - 6;
                
                // Outline
                // Top
                ctx.fillRect(bx + 1, by, bw - 2, 1); 
                // Bottom
                ctx.fillRect(bx + 1, by + bh - 1, bw - 2, 1); 
                // Left
                ctx.fillRect(bx, by + 1, 1, bh - 2); 
                // Right
                ctx.fillRect(bx + bw - 1, by + 1, 1, bh - 2); 
                
                // Sharp bottom-left corner connecting to tail
                ctx.fillRect(bx, by + bh - 1, 1, 1);

                // Tail (Asymmetric - bottom left step down)
                ctx.fillRect(bx + 1, by + bh, 1, 1);
                
                // Typing Dots Animation inside bubble (Reduced count to fit)
                const dots = Math.floor(time / 400) % 3;
                const dotY = by + 2;
                
                // Dots at +2, +4, +6
                if (dots >= 0) ctx.fillRect(bx + 2, dotY, 1, 1);
                if (dots >= 1) ctx.fillRect(bx + 4, dotY, 1, 1);
                if (dots >= 2) ctx.fillRect(bx + 6, dotY, 1, 1);
            }
        }
    };

    const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Skyline first (background) with Grid
        drawCity(canvas.width, canvas.height);

        const time = Date.now();

        figures.forEach(f => {
            // Update State
            f.timer--;
            if (f.timer <= 0) {
                if (f.state === 'walk') {
                    f.state = 'idle';
                    f.timer = 100 + Math.random() * 150;
                } else {
                    f.state = 'walk';
                    f.direction = Math.random() > 0.5 ? 1 : -1;
                    f.timer = 100 + Math.random() * 300;
                }
            }

            // Update Position
            if (f.state === 'walk') {
                f.x += f.speed * f.direction;
                if (f.x < 2) { f.x = 2; f.direction = 1; }
                if (f.x > canvas.width - 2) { f.x = canvas.width - 2; f.direction = -1; }
            }

            drawFigure(f, time);
        });

        animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
        {/* Canvas scaled up with pixelated rendering */}
        <canvas 
            ref={canvasRef} 
            className="block w-full h-full" 
            style={{ imageRendering: 'pixelated' }}
        />
    </div>
  );
};
