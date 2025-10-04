interface PawLogoProps {
  className?: string;
  size?: number;
}

export default function PawLogo({ className = "", size = 24 }: PawLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 21C12 21 8.5 18 6 15C3.5 12 3 9 5 7C7 5 9 6 12 9C15 6 17 5 19 7C21 9 20.5 12 18 15C15.5 18 12 21 12 21Z"
        fill="currentColor"
      />
      <circle cx="8" cy="6" r="2" fill="currentColor" />
      <circle cx="16" cy="6" r="2" fill="currentColor" />
      <circle cx="6" cy="10" r="1.5" fill="currentColor" />
      <circle cx="18" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}