// Force dynamic rendering to prevent build-time prerendering errors
export const dynamic = 'force-dynamic';

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
