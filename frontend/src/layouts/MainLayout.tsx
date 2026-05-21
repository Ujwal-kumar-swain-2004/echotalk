import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const MainLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Premium animated background */}
      <div className="animated-bg" />
      
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[#d946ef]/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>

      <Navbar />

      <main className="flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 overflow-hidden">
        <Outlet />
      </main>

      <footer className="w-full py-6 mt-auto text-center border-t border-white/5 relative z-10 text-gray-500 text-xs tracking-wider">
        &copy; {new Date().getFullYear()} EchoTalk. Built for visual & functional excellence.
      </footer>
    </div>
  );
};
