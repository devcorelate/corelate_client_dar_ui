import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <Link className="rounded bg-[#007a3d] px-4 py-2 text-sm font-semibold text-white" href="/portal/login/dar">
        DAR Employee Login
      </Link>
    </main>
  );
}
