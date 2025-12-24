import Navigation from '@/components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {children}
      </main>
    </>
  )
}
