export default function AdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 border-3 border-[var(--border-color)] border-t-[#C4A882] rounded-full animate-spin" />
        <p className="text-sm text-[#9CA3AF]">Carregando...</p>
      </div>
    </div>
  );
}
