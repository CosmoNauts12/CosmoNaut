export default function AuthCard({ title, children }: any) {
return (
<div className="bg-black/40 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-[350px]">
<h2 className="text-2xl font-bold mb-6">{title}</h2>
{children}
</div>
);
}