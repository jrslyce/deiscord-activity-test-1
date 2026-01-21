export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07090b] text-white" data-testid="terms-page">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold"
          data-testid="terms-title"
        >
          Terms of Service
        </h1>
        <p className="mt-6 text-base text-zinc-300" data-testid="terms-body">
          This is a placeholder Terms of Service page for the Equip Detail Discord
          Activity MVP.
        </p>
      </div>
    </div>
  );
}
