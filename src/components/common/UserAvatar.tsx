import { useState, useEffect } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  sizeClassName?: string;
  fallbackClassName?: string;
}

export default function UserAvatar({
  src,
  name,
  className = "",
  sizeClassName = "w-10 h-10 text-sm",
  fallbackClassName = "",
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const displayName = (name || "").trim() || "User";
  const initial = (displayName.charAt(0) || "U").toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={`rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center border border-primary/20 shrink-0 select-none ${sizeClassName} ${fallbackClassName} ${className}`}
        title={displayName}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={displayName}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={`rounded-full object-cover border border-border shrink-0 ${sizeClassName} ${className}`}
    />
  );
}
