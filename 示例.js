import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  Search,
  Menu,
  Layers,
  ArrowRight
} from 'lucide-react';

/* --- STAR CUP UI SYSTEM V15 (KINETIC DRAWER ENGINE) --- 
   
   PHYSICS ENGINE UPDATE:
   1. DRAWER EFFECT: Incoming theme slides UP (100% -> 0%) covering the old one.
   2. PARALLAX EXIT: Outgoing theme recedes UP (-30%) and darkens.
   3. INERTIA LAG: Content inside the incoming theme floats up with a delay/drag.
   
   THEME LOCK: Sarkaz, Sami, Mizuki, Phantom, Hortus ONLY.
*/

// --- ASSETS & CONSTANTS ---
const NAV_ITEMS = [
  { id: 0, label: 'INDEX', sub: '首页' },
  { id: 1, label: 'TOURNAMENT', sub: '比赛详情' },
  { id: 2, label: 'OPERATOR', sub: '干员' },
  { id: 3, label: 'THEME', sub: '主题一览' },
  { id: 4, label: 'MEDIA', sub: '泰拉万象' },
  { id: 5, label: 'MORE', sub: '更多内容' },
];

const NEWS = [
  { type: '公告', date: '2026 / 02 / 17', title: '【星球杯 #4】正赛小组赛分组名单公布' },
  { type: '赛讯', date: '2026 / 02 / 13', title: '海选赛最终轮 - 晋级名单公示' },
  { type: '回顾', date: '2025 / 11 / 10', title: '星球杯 #3 冠军访谈：血狼破军' },
];

// --- THEME DATA (LOCKED) ---
const THEME_DATA = [
  {
    id: 'sarkaz',
    titleCn: '萨卡兹的无终奇语',
    titleEn: 'Sarkaz\'s\nFurnaceside Fables',
    seriesId: '#5',
    color: '#ec4899', // Pink
    bgUrl: 'https://placehold.co/1920x1080/290818/ec4899.png?text=Sarkaz+Theme+Background',
    shadowColor: 'rgba(236, 72, 153, 0.4)'
  },
  {
    id: 'sami',
    titleCn: '探索者的银凇止境',
    titleEn: 'Expeditioner\'s\nJoklumarkar',
    seriesId: '#4',
    color: '#a5f3fc', // Ice Blue
    bgUrl: 'https://placehold.co/1920x1080/082f49/a5f3fc.png?text=Sami+Theme+Background',
    shadowColor: 'rgba(165, 243, 252, 0.4)'
  },
  {
    id: 'mizuki',
    titleCn: '水月与深蓝之树',
    titleEn: 'Mizuki &\nCaerula Arbor',
    seriesId: '#3',
    color: '#00AEEF', // Mizuki Blue
    bgUrl: 'https://placehold.co/1920x1080/050b14/00AEEF.png?text=Mizuki+Theme+Background',
    shadowColor: 'rgba(0, 174, 239, 0.4)'
  },
  {
    id: 'phantom',
    titleCn: '傀影与猩红孤钻',
    titleEn: 'Phantom &\nCrimson Solitaire',
    seriesId: '#2',
    color: '#dc2626', // Crimson Red
    bgUrl: 'https://placehold.co/1920x1080/2a0a0a/dc2626.png?text=Phantom+Theme+Background',
    shadowColor: 'rgba(220, 38, 38, 0.4)'
  },
  {
    id: 'hortus',
    titleCn: '空想花庭',
    titleEn: 'Hortus de\nEscapismo',
    seriesId: 'SIDE', // Special
    color: '#fbbf24', // Gold
    bgUrl: 'https://placehold.co/1920x1080/1a1405/fbbf24.png?text=Hortus+Theme+Background',
    shadowColor: 'rgba(251, 191, 36, 0.4)'
  }
];

// --- UTILITY COMPONENTS ---

const TechButton = ({ children, className = "", delay = "0ms" }) => (
  <button
    className={`
      relative px-8 py-3 overflow-hidden font-bold tracking-widest text-white bg-black/90 
      border border-gray-600 group hover:border-cyan-400 transition-all duration-300
      clip-path-button ${className}
    `}
    style={{ transitionDelay: delay }}
  >
    <style>{`.clip-path-button { clip-path: polygon(0 0, 100% 0, 100% 70%, 90% 100%, 0 100%); }`}</style>
    <div className="absolute top-0 right-0 w-3 h-3 bg-white -mr-1.5 -mt-1.5 rotate-45 group-hover:bg-cyan-400 transition-colors"></div>
    <div className="relative z-10 flex items-center gap-3 group-hover:text-cyan-400 transition-colors uppercase text-sm">
      {children}
    </div>
    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 skew-x-12"></div>
  </button>
);

// --- SECTIONS ---

const HomeSection = ({ isActive, parallaxStyle, mousePos }) => (
  <div className="absolute inset-0 w-full h-full bg-[#0a0a0a] overflow-hidden" style={parallaxStyle}>
    <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-100 ease-out"
      style={{
        backgroundImage: "url('https://placehold.co/1920x1080/222/222.png?text=Star+Cup+PV+Frame')",
        transform: `scale(1.05) translate(${mousePos.x * -0.2}px, ${mousePos.y * -0.2}px)`
      }}>
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
    <div className={`absolute left-[-5%] bottom-[10%] text-[18vw] font-black text-white/5 leading-none select-none whitespace-nowrap pointer-events-none tracking-tighter transition-all duration-1000 ease-out
        ${isActive ? 'translate-x-0 opacity-10' : 'translate-x-[-10%] opacity-0'}
    `} style={{ transform: `translateX(${mousePos.x * 0.5}px)` }}>
      STAR CUP
    </div>
    <div className="relative z-10 container mx-auto px-8 h-full flex flex-col justify-center pt-20">
      <div className={`transition-all duration-1000 delay-300 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <h1 className="text-8xl md:text-[9rem] font-black text-white tracking-tighter leading-[0.85] mb-2 mix-blend-overlay">
          STAR CUP
        </h1>
        <div className="text-2xl font-bold tracking-[0.5em] text-cyan-400 pl-2 mb-8 flex items-center gap-4">
          <div className="h-[2px] w-12 bg-cyan-400"></div>
          星球杯
        </div>
      </div>
      <p className={`text-gray-300 max-w-lg text-sm tracking-widest leading-loose mb-12 uppercase transition-all duration-1000 delay-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        "Integrated Strategies" Tournament. <br />
        Commanders from all over Terra gather here.
      </p>
      <div className={`transition-all duration-1000 delay-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <TechButton>ENTER TOURNAMENT</TechButton>
      </div>
    </div>
  </div>
);

const InfoSection = ({ isActive, parallaxStyle }) => (
  <div className="absolute inset-0 w-full h-full bg-[#161616] overflow-hidden" style={parallaxStyle}>
    <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-color-dodge"
      style={{ backgroundImage: "url('https://placehold.co/1920x1080/003366/000.png?text=Blue+Smoke')" }}></div>
    <div className="container mx-auto px-8 md:px-16 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center h-full pt-20">
      <div className={`col-span-12 md:col-span-7 h-full max-h-[60vh] flex flex-col justify-center transition-all duration-1000 delay-300 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-[15vh] opacity-0'}`}>
        <div className="relative w-full aspect-video group cursor-pointer overflow-hidden border-2 border-cyan-900/50 hover:border-cyan-500 transition-all duration-500 shadow-2xl bg-black">
          <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-1000"
            style={{ backgroundImage: "url('https://placehold.co/1200x800/111/fff.png?text=Star+Cup+Visual')" }}></div>
          <div className="absolute top-4 right-4 bg-cyan-600 text-white text-xs font-bold px-3 py-1">进行中</div>
          <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
            <h2 className="text-5xl font-black text-white mb-2 tracking-wide font-serif italic">星球杯 #4</h2>
            <p className="text-cyan-400 text-sm font-mono tracking-wider mb-4">INTEGRATED STRATEGY TOURNAMENT</p>
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 font-bold text-sm flex items-center gap-2 transition-colors">
              查看赛程 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="col-span-12 md:col-span-5 flex flex-col justify-center h-full max-h-[60vh]">
        <div className={`flex items-end gap-4 mb-8 border-b border-gray-800 pb-4 transition-all duration-1000 delay-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
          <h3 className="text-3xl font-bold text-white">HISTORY</h3>
          <span className="text-cyan-500 font-mono mb-1">/ 往届比赛</span>
        </div>
        <div className="space-y-4">
          {NEWS.map((news, idx) => (
            <div key={idx}
              className={`group relative bg-black/50 p-5 border-l-[3px] border-transparent hover:border-cyan-500 transition-all duration-300 cursor-pointer overflow-hidden
                     transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
              style={{ transitionDelay: `${600 + idx * 100}ms` }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${news.type === '公告' ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-gray-400'}`}>{news.type}</span>
                <span className="text-gray-500 font-mono text-xs">{news.date}</span>
              </div>
              <p className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors truncate">{news.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const OperatorSection = ({ isActive, parallaxStyle }) => (
  <div className="absolute inset-0 w-full h-full bg-[#f0f0f0] text-black overflow-hidden" style={parallaxStyle}>
    <div className={`absolute top-[15%] left-[-5%] text-[20vw] font-black text-[#e5e5e5] select-none leading-none transition-transform duration-[1.5s] ease-out ${isActive ? 'translate-x-0' : '-translate-x-32'}`}>
      PLAYER
    </div>
    <div className="container mx-auto px-8 relative z-10 grid grid-cols-1 md:grid-cols-2 h-full items-center">
      <div className="pt-20 z-20">
        <div className={`transition-all duration-1000 delay-300 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-xl">03</div>
            <div className="h-px w-20 bg-black"></div>
            <span className="font-mono font-bold tracking-widest text-gray-500">DEFENDING CHAMPION</span>
          </div>
        </div>
        <div className={`transition-all duration-1000 delay-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
          <h1 className="text-8xl font-black tracking-tighter uppercase mb-0 leading-[0.8]">NO.1</h1>
          <h2 className="text-5xl font-bold text-gray-400 mb-8">血狼破军</h2>
        </div>
        <div className={`max-w-md bg-white p-6 shadow-xl border-l-4 border-black mb-8 transition-all duration-1000 delay-700 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0 translate-y-20'}`}>
          <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">
            上届星球杯冠军。以极致的计算和对特种干员的深刻理解著称。
            <br />
            "Mistakes are not allowed."
          </p>
          <div className="flex gap-4 font-mono text-xs text-gray-500">
            <div><span className="block font-bold text-black">ID</span>XUELANG</div>
            <div><span className="block font-bold text-black">CLASS</span>SPECIALIST</div>
          </div>
        </div>
      </div>
      <div className={`absolute right-0 bottom-0 h-[110%] w-[60%] z-10 transition-all duration-[1.2s] delay-200 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-32 opacity-0'}`}>
        <img src="https://placehold.co/800x1200/transparent/transparent.png?text=Champion+Render" alt="Kal'tsit" className="h-full w-full object-contain object-bottom drop-shadow-2xl" />
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <svg viewBox="0 0 200 400" className="h-full fill-gray-800/10">
            <path d="M60,400 L80,100 L120,80 L140,400 Z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

// --- KINETIC THEME SECTION ---
const ThemeSection = ({ isActive, parallaxStyle }) => {
  const [activeThemeId, setActiveThemeId] = useState('mizuki');
  const [prevThemeId, setPrevThemeId] = useState(null);
  const [animating, setAnimating] = useState(false);

  const activeTheme = THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[2];
  const prevTheme = THEME_DATA.find(t => t.id === prevThemeId);

  const handleThemeChange = (newId) => {
    if (newId === activeThemeId || animating) return;
    setPrevThemeId(activeThemeId);
    setActiveThemeId(newId);
    setAnimating(true);

    // Animation duration match CSS (1000ms)
    setTimeout(() => {
      setAnimating(false);
      setPrevThemeId(null);
    }, 1000);
  };

  // Helper for Inertia Content
  const InertiaContent = ({ theme, isActive, isEntering }) => (
    <div className="relative z-10 container mx-auto px-8 h-full">
      {/* LEFT CONTENT: Title Block */}
      <div className={`absolute left-12 top-1/2 -translate-y-[40%] text-white transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1) transform 
               ${isActive || isEntering ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}
               ${isEntering ? 'delay-200 duration-[1200ms]' : ''} 
           `}>
        <h3 className="text-3xl md:text-5xl font-bold uppercase tracking-widest mb-0 opacity-90 leading-tight whitespace-pre-line">
          {theme.titleEn}
        </h3>
        <h1 className="text-6xl md:text-[6rem] font-serif font-black mb-6 mt-2 tracking-wide leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 filter drop-shadow-lg">
          {theme.titleCn}
        </h1>
        <div className="w-24 h-2 mb-8 rounded-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: theme.color }}></div>
      </div>

      {/* TOP RIGHT: Logo Mark */}
      <div className={`absolute top-28 right-8 text-white text-right transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1) transform 
                ${isActive || isEntering ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
                ${isEntering ? 'delay-300 duration-[1200ms]' : ''}
           `}>
        <div className="flex items-center justify-end gap-2 mb-1">
          <Layers size={18} />
          <span className="font-bold text-sm tracking-widest border-2 border-white px-1">集成战略</span>
        </div>
        <div className="text-7xl font-black leading-none tracking-tighter opacity-90 font-['Impact']">{theme.seriesId}</div>
        <div className="text-[10px] uppercase tracking-[0.5em] mt-1 opacity-70">Integrated Strategies</div>
      </div>

      {/* BOTTOM BAR: Navigation Buttons */}
      <div className={`absolute bottom-0 left-0 w-full flex items-end transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1) transform 
                ${isActive || isEntering ? 'translate-y-0 opacity-100' : 'translate-y-40 opacity-0'}
                ${isEntering ? 'delay-500 duration-[1200ms]' : ''}
           `}>
        <div className="h-16 bg-[#1a1a1a]/90 backdrop-blur text-gray-300 flex items-center px-10 gap-4 hover:bg-[#333] hover:text-white transition-colors cursor-pointer min-w-[200px]">
          <ArrowRight className="rotate-180" size={20} />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-base">返回</span>
            <span className="text-[10px] uppercase font-mono tracking-wider">GO BACK</span>
          </div>
        </div>
        <div className="h-16 text-white flex items-center px-10 gap-4 transition-colors cursor-pointer min-w-[240px]"
          style={{ backgroundColor: theme.color }}>
          <div className="flex flex-col leading-none text-right flex-1">
            <span className="font-bold text-base mix-blend-hard-light text-black">活动主题网站</span>
            <span className="text-[10px] uppercase font-mono tracking-wider mix-blend-hard-light text-black">WEBSITE</span>
          </div>
          <ArrowRight size={20} className="text-black" />
        </div>
        <div className="flex-1 h-16 border-t border-white/10 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <span className="text-4xl md:text-6xl font-black text-white/10 uppercase tracking-tighter truncate font-['Impact']">
            INTEGRATED STRATEGIES
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden font-sans" style={parallaxStyle}>

      {/* LAYER 1: PREVIOUS THEME (Outgoing - Parallax Exit) */}
      {prevTheme && (
        <div className="absolute inset-0 w-full h-full z-10 transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: 'translateY(-30%) scale(0.95)',
            filter: 'brightness(0.3)'
          }}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${prevTheme.bgUrl}')` }}></div>
          {/* We don't render content for outgoing theme to keep it clean, or we could render it frozen */}
        </div>
      )}

      {/* LAYER 2: ACTIVE THEME (Incoming - Drawer Entry) */}
      <div className={`absolute inset-0 w-full h-full z-20 transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${animating ? 'translate-y-0' : 'translate-y-0'}`}
        style={animating ? { transform: 'translateY(0%)' } : {}}
      >
        {/* The initial state for enter needs to be 100% if we are simulating the enter. 
                React state transition trick: When prevTheme exists (animating), current theme is entering.
            */}
        <div className={`absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] 
                 ${prevTheme ? 'translate-y-0' : ''}`} // Logic handled by wrapper mostly, but let's ensure initialization
          style={{
            backgroundImage: `url('${activeTheme.bgUrl}')`,
            transform: prevTheme ? 'none' : 'none', // Reset transform when active
            animation: prevTheme ? 'slideUp 1s cubic-bezier(0.22,1,0.36,1) forwards' : 'none'
          }}
        >
          <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0%); }
                    }
                 `}</style>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
        </div>

        {/* CONTENT LAYER WITH INERTIA */}
        <InertiaContent theme={activeTheme} isActive={!prevTheme} isEntering={!!prevTheme} />
      </div>

      {/* NAVIGATION OVERLAY (Always on Top) */}
      <div className="absolute right-0 bottom-32 z-30 flex flex-col items-end">
        {THEME_DATA.map((theme) => {
          const isSelected = theme.id === activeThemeId;
          return (
            <div key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`
                      w-[320px] h-14 flex items-center justify-between px-6 cursor-pointer mb-2 transition-all duration-300 border-r-4 relative overflow-hidden group
                      ${isSelected
                  ? 'text-white translate-x-0'
                  : 'bg-black/60 text-gray-500 hover:bg-black/80 hover:text-white translate-x-8 hover:translate-x-4 backdrop-blur-sm border-transparent'
                }
                    `}
              style={isSelected ? { backgroundColor: theme.color, borderColor: 'white', boxShadow: `0 0 20px ${theme.shadowColor}` } : {}}
            >
              <span className="font-bold text-base tracking-widest relative z-10">{theme.titleCn}</span>
              <span className="text-xs font-mono font-bold opacity-60 relative z-10">{theme.id.toUpperCase()}</span>
              {isSelected && <ChevronRight size={20} className="relative z-10" />}

              {/* Hover Effect */}
              {!isSelected && (
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AboutTerraSection = ({ isActive, parallaxStyle }) => (
  <div className="absolute inset-0 w-full h-full bg-[#0d0d0d] overflow-hidden" style={parallaxStyle}>
    <div className="container mx-auto px-8 h-full flex items-center justify-between relative z-10">
      <div className={`space-y-8 transition-all duration-1000 delay-300 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
        <div>
          <h2 className="text-lg font-bold text-gray-500 mb-2">ABOUT TERRA</h2>
          <h1 className="text-6xl font-black text-white mb-4">泰拉万象</h1>
          <div className="w-20 h-2 bg-white mb-6"></div>
          <p className="text-gray-400 max-w-sm text-sm">这里是泰拉，充满了未知的可能与危险。<br />探索这片大地，揭开它的秘密。</p>
        </div>
        <div className="space-y-4">
          {['MONSTER SIREN', 'GALLERY', 'OPERATOR', 'VIDEO'].map((item, i) => (
            <div key={i} className="flex items-center gap-4 group cursor-pointer">
              <div className="w-4 h-4 border border-gray-500 group-hover:bg-cyan-400 group-hover:border-cyan-400 transition-colors"></div>
              <span className="font-bold text-gray-400 group-hover:text-white transition-colors">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`relative w-[800px] h-[600px] transition-all duration-[1.5s] delay-200 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-[20vh] opacity-0'}`}>
        <img src="https://placehold.co/800x600/1a1a1a/333.png?text=Isometric+Scene" className="w-full h-full object-contain" />
        <div className="absolute top-0 right-0 p-4 bg-black border border-gray-700 text-xs font-mono text-cyan-500 animate-pulse">
          SYSTEM ONLINE
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleWheel = (e) => {
      if (isScrolling) return;
      if (Math.abs(e.deltaY) < 30) return;

      if (e.deltaY > 0 && activeSection < NAV_ITEMS.length - 1) {
        setIsScrolling(true);
        setActiveSection(prev => prev + 1);
        setTimeout(() => setIsScrolling(false), 1200);
      } else if (e.deltaY < 0 && activeSection > 0) {
        setIsScrolling(true);
        setActiveSection(prev => prev - 1);
        setTimeout(() => setIsScrolling(false), 1200);
      }
    };

    window.addEventListener('wheel', handleWheel);
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouse);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [activeSection, isScrolling]);

  const getSectionStyle = (index) => {
    const isPast = index < activeSection;
    const isFuture = index > activeSection;
    const isActive = index === activeSection;

    let transform = 'translate3d(100%, 0, 0)';
    let zIndex = 10;
    let brightness = 1;

    if (isActive) {
      transform = 'translate3d(0, 0%, 0)';
      zIndex = 20;
    } else if (isPast) {
      transform = 'translate3d(-30%, 0, 0)';
      zIndex = 10;
      brightness = 0.4;
    } else if (isFuture) {
      transform = 'translate3d(100%, 0, 0)';
      zIndex = 30;
    }

    return {
      transform,
      zIndex,
      filter: `brightness(${brightness})`,
      transition: 'transform 1.2s cubic-bezier(0.65, 0, 0.35, 1), filter 1.2s ease'
    };
  };

  return (
    <div className="bg-black h-screen w-screen text-white overflow-hidden font-sans select-none relative">
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-start justify-between mix-blend-difference text-white transition-opacity duration-300">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveSection(0)}>
          <div className="w-10 h-10 border-2 border-white flex items-center justify-center font-black italic text-xl group-hover:bg-white group-hover:text-black transition-colors">SC</div>
          <div className="flex flex-col leading-none">
            <span className="font-bold tracking-[0.2em] text-lg">星球杯</span>
            <span className="text-[10px] tracking-[0.3em] opacity-70">STAR CUP</span>
          </div>
        </div>
        <nav className="hidden lg:flex gap-12 bg-black/20 backdrop-blur-sm px-8 py-3 rounded-sm border border-white/10">
          {NAV_ITEMS.map((item, index) => (
            <div key={index}
              onClick={() => setActiveSection(index)}
              className={`flex flex-col items-center cursor-pointer group ${activeSection === index ? 'text-cyan-400' : 'text-gray-400'}`}>
              <span className="font-bold text-sm tracking-widest group-hover:text-white transition-colors">{item.label}</span>
              <span className="text-[10px] scale-0 group-hover:scale-100 transition-transform origin-top">{item.sub}</span>
            </div>
          ))}
        </nav>
        <div className="flex gap-6">
          <Search className="hover:text-cyan-400 transition-colors cursor-pointer" />
          <Menu className="hover:text-cyan-400 transition-colors cursor-pointer" />
        </div>
      </header>
      <main className="w-full h-full relative bg-black perspective-[1000px]">
        <HomeSection isActive={activeSection === 0} parallaxStyle={getSectionStyle(0)} mousePos={mousePos} />
        <InfoSection isActive={activeSection === 1} parallaxStyle={getSectionStyle(1)} />
        <OperatorSection isActive={activeSection === 2} parallaxStyle={getSectionStyle(2)} />
        <ThemeSection isActive={activeSection === 3} parallaxStyle={getSectionStyle(3)} />
        <AboutTerraSection isActive={activeSection === 4} parallaxStyle={getSectionStyle(4)} />
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505]" style={getSectionStyle(5)}>
          <div className={`transition-all duration-1000 delay-300 transform ${activeSection === 5 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
            <h1 className="text-6xl font-thin tracking-[1em] text-gray-700">MORE</h1>
          </div>
        </div>
      </main>
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 z-50 pointer-events-none hidden md:flex">
        <div className="text-6xl font-black text-white/90 tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
          <span className="text-cyan-400">0{activeSection}</span>
          <span className="text-2xl text-white/40 font-normal ml-2 align-top">/ 0{NAV_ITEMS.length - 1}</span>
        </div>
        <div className="text-xs font-bold tracking-[0.3em] text-white/60 uppercase mb-4">{NAV_ITEMS[activeSection]?.label}</div>
        <div className="w-1 h-48 bg-white/10 relative overflow-hidden rounded-full">
          <div
            className="absolute top-0 left-0 w-full bg-cyan-400 transition-all duration-700 ease-out shadow-[0_0_10px_#22d3ee]"
            style={{ height: `${((activeSection) / (NAV_ITEMS.length - 1)) * 100}%` }}
          />
        </div>
        <div className="mt-8 pointer-events-auto flex flex-col gap-3 items-end">
        </div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      <div className="fixed inset-0 pointer-events-none z-30 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
    </div>
  );
}