import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-[#fbf9f4] py-8 text-center text-xs text-slate-500 font-semibold space-y-2">
      <div className="flex items-center justify-center space-x-6">
        <span>100% Home Cooked</span>
        <span>•</span>
        <span>Zero Preservatives</span>
        <span>•</span>
        <span>Hygiene Certified</span>
      </div>
      <p>© 2026 Yazhisai Cloud Kitchen (யாழிசை மனையக உணவகம்). All rights reserved.</p>
    </footer>
  );
};
