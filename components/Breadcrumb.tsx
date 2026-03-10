import Link from "next/link";

export default function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      <Link href="/dashboard" className="mr-2 text-gray-500 hover:text-cyan-700">
        <span className="inline-block align-middle mr-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L3 9H5V17H8V13H12V17H15V9H17L10 3Z" fill="currentColor"/>
          </svg>
        </span> Home
      </Link>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center">
          <span className="mx-2">&gt;</span>
          {item.href ? (
            <Link href={item.href} className="text-gray-500 hover:text-cyan-700">{item.label}</Link>
          ) : (
            <span className="text-gray-700 font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
