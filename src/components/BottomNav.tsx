import React from 'react';
import { Home, Coins, LineChart, Info } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'rates', label: 'Rates', icon: Coins },
    { id: 'history', label: 'History', icon: LineChart },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0E121A]/95 backdrop-blur-lg border-t border-[#232D3F] px-2 py-1 safe-area-pb">
      <div className="grid grid-cols-4 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                isActive ? 'text-[#F3E5AB]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-[#D4AF37] to-[#F5DE88] rounded-full shadow-[0_0_10px_#D4AF37]" />
              )}
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110 text-[#D4AF37]' : ''}`} />
              <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'font-semibold text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
