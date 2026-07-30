import { useState, useEffect } from 'react';

export default function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      const isMobileWidth = window.innerWidth < 768; // standard md breakpoint
      
      setIsBlocked(isPortrait || isMobileWidth);
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center font-sans">
        <img src="/logo.svg" alt="RABP Logo" className="w-24 h-24 mb-6 drop-shadow-sm" />
        <h1 className="text-2xl font-medium text-[#1f1f1f] mb-3 tracking-tight">Perangkat Tidak Didukung</h1>
        <p className="text-[#444746] text-base max-w-sm mb-8 leading-relaxed">
          Mohon maaf, Sistem RABP hanya dapat diakses melalui Desktop atau layar berukuran besar dalam mode Landscape.
        </p>
        <a 
          href="https://rakhan.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-8 py-3 rounded-full text-[15px] font-medium text-white bg-[#0b57d0] hover:bg-[#0842a0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b57d0] transition-colors ripple shadow-sm"
        >
          Meet Our Developer
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
