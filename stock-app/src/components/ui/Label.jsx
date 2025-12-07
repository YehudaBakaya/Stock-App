import React from "react";

export default function Label({ children, className = "" }) {
  return (
    <label className={`block font-medium text-sm ${className}`}>
      {children}
    </label>
  );
}
