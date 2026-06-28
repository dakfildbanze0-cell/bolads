import React from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: string; // e.g. "w-8 h-8", "w-10 h-10"
}

export default function UserAvatar({ src, name, className = "", size = "w-10 h-10" }: UserAvatarProps) {
  const defaultPlaceholder = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
  const hasAvatar = src && src.trim() !== "" && src !== defaultPlaceholder;

  if (hasAvatar) {
    return (
      <img
        src={src}
        alt={name || "Usuário"}
        className={`${size} rounded-full object-cover shrink-0 border border-zinc-800 ${className}`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If the image fails to load, trigger fallback to initial
          e.currentTarget.style.display = "none";
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = parent.querySelector(".avatar-fallback");
            if (fallback) {
              (fallback as HTMLElement).style.display = "flex";
            }
          }
        }}
      />
    );
  }

  const userName = name || "Usuário";
  const initial = userName.trim().charAt(0).toUpperCase();

  // Consistent background color based on name hash
  const colors = [
    "bg-red-500 text-white",
    "bg-orange-500 text-white",
    "bg-amber-500 text-white",
    "bg-emerald-500 text-white",
    "bg-teal-500 text-white",
    "bg-blue-500 text-white",
    "bg-indigo-500 text-white",
    "bg-purple-500 text-white",
    "bg-pink-500 text-white",
    "bg-rose-500 text-white",
  ];
  
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div
      className={`${size} rounded-full flex items-center justify-center shrink-0 border border-zinc-800 font-bold select-none text-center ${colorClass} ${className}`}
      title={userName}
    >
      {initial}
    </div>
  );
}
