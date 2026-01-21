export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090b] text-white" data-testid="privacy-page">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold"
          data-testid="privacy-title"
        >
          Privacy Policy
        </h1>
        <p className="mt-6 text-base text-zinc-300" data-testid="privacy-body">
          This is a placeholder Privacy Policy page for the Equip Detail Discord
          Activity MVP.
        </p>
      </div>
    </div>
  );
}
