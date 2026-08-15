export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-40 rounded-lg bg-surface" />
      <div className="card h-24 p-5" />
      <div className="card h-64 p-5" />
      <div className="card h-40 p-5" />
    </div>
  );
}
