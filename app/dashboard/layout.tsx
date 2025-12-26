import Navigation from '@/components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
