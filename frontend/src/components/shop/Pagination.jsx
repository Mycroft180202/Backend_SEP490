import React from 'react';

export default function Pagination({ className = '' }) {
  return (
    <div className={`${className} flex items-center gap-4`}>
      <button className="p-2">&lt;</button>
      <div className="flex gap-4">
        <button className="font-bold">1</button>
        <button className="text-[#a0a0a0]">2</button>
        <button className="text-[#a0a0a0]">3</button>
        <span className="text-[#a0a0a0]">...</span>
        <button className="text-[#a0a0a0]">10</button>
      </div>
      <button className="p-2">&gt;</button>
    </div>
  );
}
