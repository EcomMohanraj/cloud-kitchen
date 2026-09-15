import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { DeploymentDetector } from '@/components/DeploymentDetector';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Yazhisai Cloud Kitchen | யாழிசை மனையக உணவகம்',
  description: 'Authentic South Indian & Global home-cooked delicacies prepared on-demand by Chef Yazhisai. Pre-order for specific calendar dates & meal slots.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <WhatsAppButton />
        <DeploymentDetector />
      </body>
    </html>
  );
}


