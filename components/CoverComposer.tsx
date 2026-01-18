import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface TextStyle {
  id: number;
  name: string;
  render: (title: string, fontSize: number) => React.ReactNode;
}

export const TEXT_STYLES: TextStyle[] = [
  { 
    id: 1, 
    name: '封面大字', 
    render: (title, fontSize) => (
      <div className="relative inline-block text-center">
        <span 
          className="absolute top-1 left-1 text-black/20 font-black italic whitespace-pre-wrap leading-tight select-none blur-[1px]"
          style={{ fontSize: `${fontSize}px` }}
        >{title}</span>
        <span 
          className="relative z-10 font-black text-white italic whitespace-pre-wrap leading-tight drop-shadow-lg tracking-tighter" 
          style={{ textShadow: '2px 2px 0px #ff2442', fontSize: `${fontSize}px` }}
        >
          {title}
        </span>
      </div>
    )
  },
  { 
    id: 2, 
    name: '醒目标签', 
    render: (title, fontSize) => (
      <div className="flex flex-col items-center gap-2">
        {title.split(/[,，\s]+/).map((line, i) => (
          <span 
            key={i} 
            className="bg-xhs-red text-white font-bold px-4 py-2 rounded-lg shadow-xl border-2 border-white"
            style={{ fontSize: `${fontSize * 0.6}px` }}
          >
            {line}
          </span>
        ))}
      </div>
    )
  },
  { 
    id: 3, 
    name: '极简高级', 
    render: (title, fontSize) => (
      <div className="bg-white/90 backdrop-blur-md border border-white/50 px-6 py-4 rounded-[1.5rem] shadow-sm">
        <h2 
          className="font-bold text-gray-900 tracking-wide leading-relaxed text-center"
          style={{ fontSize: `${fontSize * 0.5}px` }}
        >
          {title}
        </h2>
        <div className="w-8 h-1 bg-gray-900 mx-auto mt-2 rounded-full"></div>
      </div>
    )
  },
  { 
    id: 4, 
    name: '霓虹发光', 
    render: (title, fontSize) => (
      <h2 
        className="font-black text-white text-center leading-snug" 
        style={{ textShadow: '0 0 10px #ff2442, 0 0 20px #ff2442, 0 0 40px #ff2442', fontSize: `${fontSize}px` }}
      >
        {title}
      </h2>
    )
  },
  { 
    id: 5, 
    name: '杂志排版', 
    render: (title, fontSize) => (
      <div className="text-left border-l-8 border-xhs-red pl-4 bg-gradient-to-r from-black/40 to-transparent py-2">
        <h2 
          className="font-black text-white leading-tight tracking-tight uppercase"
          style={{ fontSize: `${fontSize * 0.8}px` }}
        >
          {title}
        </h2>
        <p className="text-white/80 text-xs mt-1 font-medium tracking-widest uppercase">RedNote • Selection</p>
      </div>
    )
  }
];

interface Props {
  imageUrl: string;
  title: string;
  selectedStyle: TextStyle;
  textWidth: number;
  fontSize: number;
  aspectRatio: '3:4' | '1:1';
}

const CoverComposer = forwardRef<HTMLDivElement, Props>(({ imageUrl, title, selectedStyle, textWidth, fontSize, aspectRatio }, ref) => {
  const [position, setPosition] = useState({ x: 50, y: 20 }); 
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Expose the internal container ref to the parent
  useImperativeHandle(ref, () => containerRef.current!);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);
  
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setPosition({
      x: Math.min(Math.max(x, 0), 100),
      y: Math.min(Math.max(y, 0), 100)
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-gray-100 cursor-move group select-none transition-all duration-300 shadow-inner`}
      style={{ aspectRatio: aspectRatio === '3:4' ? '3/4' : '1/1' }}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleDrag}
      onTouchEnd={handleDragEnd}
    >
      <img 
        src={imageUrl} 
        alt="Generated Cover" 
        className="w-full h-full object-cover pointer-events-none"
      />
      
      {/* Visual Guide Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity z-0">
         <div className="w-full h-full flex flex-col">
            <div className="flex-1 border-b border-white"></div>
            <div className="flex-1 border-b border-white"></div>
            <div className="flex-1"></div>
         </div>
      </div>

      {/* Rendered Text Component */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-75 ease-out"
        style={{ 
          left: `${position.x}%`, 
          top: `${position.y}%`,
          width: `${textWidth}%`, 
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="w-full flex justify-center break-words text-center">
           {selectedStyle.render(title, fontSize)}
        </div>
      </div>

      {/* Helper Badge */}
      <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-end">
        <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
           可拖拽移动文案
        </span>
        <span className="bg-xhs-red/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md font-bold">
           {aspectRatio}
        </span>
      </div>
    </div>
  );
});

export default CoverComposer;