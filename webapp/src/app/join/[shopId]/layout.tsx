import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Shop - Happy InLine',
  description: 'Register with this business to book appointments using Happy InLine',
  other: {
    // iOS Smart App Banner - shows native "OPEN" banner in Safari if app is installed
    'apple-itunes-app': 'app-id=6756240306, app-argument=https://happyinline.com/join/',
  },
};

export default function JoinShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
