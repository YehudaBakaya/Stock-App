import React from "react";

export default function Progress({ value = 0, className = "" }) {
  return (
    <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className="bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 h-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
