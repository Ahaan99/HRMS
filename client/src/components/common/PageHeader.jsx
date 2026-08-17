export default function PageHeader({ title, desc }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {desc && <p className="text-gray-500 mt-1">{desc}</p>}
    </div>
  );
}

