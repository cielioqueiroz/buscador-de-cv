import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tracker de candidaturas',
  robots: { index: false, follow: false },
};

export default function CandidaturasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
