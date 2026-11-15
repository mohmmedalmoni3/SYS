export default function WorkspaceLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-3 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-12 gap-3.5">
        <div className="skeleton col-span-12 h-64 rounded-[var(--radius)] lg:col-span-7" />
        <div className="col-span-12 grid grid-cols-2 gap-3 lg:col-span-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-[120px] rounded-[var(--radius)]" />
          ))}
        </div>
        <div className="skeleton col-span-12 h-56 rounded-[var(--radius)] lg:col-span-8" />
        <div className="skeleton col-span-12 h-56 rounded-[var(--radius)] lg:col-span-4" />
      </div>
    </div>
  );
}
