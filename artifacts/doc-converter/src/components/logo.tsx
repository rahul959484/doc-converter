export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-primary shrink-0 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary-foreground relative z-10"
        >
          <path
            d="M4 6C4 4.89543 4.89543 4 6 4H12L20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path
            d="M4 6C4 4.89543 4.89543 4 6 4H13.5M4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12.5M4 6H9.5C10.6046 6 11.5 6.89543 11.5 8V12.5M20 12.5L13.5 6M20 12.5H13.5V6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 14H15.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 10H10.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="font-bold text-xl tracking-tight text-foreground">
        DocConvert
      </span>
    </div>
  );
}