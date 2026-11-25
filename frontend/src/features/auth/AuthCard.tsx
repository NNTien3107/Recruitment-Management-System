import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto mt-12 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-xl font-semibold">{title}</h1>
      {children}
      <p className="mt-4 text-sm text-gray-600">{footer}</p>
    </div>
  );
}
