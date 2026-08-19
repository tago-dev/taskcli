import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao TaskCli</span>
        </Link>
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase text-[var(--text-main)]">
            Task<span className="text-[var(--accent)]">Cli</span> Auth
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center w-full">
        <SignIn
          appearance={{
            elements: {
              card: "bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl rounded-2xl",
              headerTitle: "text-[var(--text-main)] font-mono",
              headerSubtitle: "text-[var(--text-muted)] font-mono",
              socialButtonsBlockButton: "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] font-mono",
              formButtonPrimary: "bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 font-mono font-bold",
              formFieldInput: "bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-main)] font-mono",
              formFieldLabel: "text-[var(--text-muted)] font-mono",
              footerActionLink: "text-[var(--accent)] hover:underline font-mono",
              dividerLine: "bg-[var(--border-color)]",
              dividerText: "text-[var(--text-dim)] font-mono",
            },
          }}
        />
      </div>
    </div>
  );
}
