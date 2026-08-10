import { initials } from "@/lib/format";

const PALETTE = [
  "bg-brand-100 text-brand-700",
  "bg-blue-50 text-blue-600",
  "bg-purple-50 text-purple-600",
  "bg-amber-50 text-amber-600",
];

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-base" }[
    size
  ];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${paletteFor(
        name
      )} ${sizeClasses} ${className}`}
    >
      {initials(name)}
    </div>
  );
}
