export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        <p className="text-neutral-400 mb-6">Failed to authenticate. Please try again.</p>
        <a
          href="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
