export default function AuthCard({ title, children }: any) {
  return (
    <div className="glass p-10 rounded-3xl shadow-2xl w-[420px] border border-white/20">
      <h2 className="text-3xl font-semibold mb-6 text-white">
        {title}
      </h2>

      {children}
    </div>
  );
}
