import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/providers';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'MyFinance', template: '%s | MyFinance' },
  description: 'Gestão financeira pessoal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
