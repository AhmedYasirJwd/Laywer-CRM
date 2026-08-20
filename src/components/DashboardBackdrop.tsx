import Image from "next/image";

// Light Karachi-skyline illustration behind the dashboard greeting. Sized per
// breakpoint so the skyline itself (not just sky) stays in frame on both a
// narrow phone and a wide desktop viewport, then fades into the page
// background at the bottom so it blends in instead of cutting off hard.
export function DashboardBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-52 overflow-hidden rounded-b-[1.75rem] sm:h-64 sm:rounded-b-[2rem] lg:h-72"
    >
      <Image
        src="/images/dashboard-skyline.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_top] opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
