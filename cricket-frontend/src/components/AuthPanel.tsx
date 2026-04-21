import { useState } from "react";

type AuthPanelProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
};

export default function AuthPanel({ onLogin, onRegister }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }

      setPassword("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Authentication failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Supabase Access</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Login is optional. You can still score locally and sync later.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMode((currentMode) => (currentMode === "login" ? "register" : "login"))}
          className="rounded-full border border-cyan-400/40 px-4 py-2 text-sm text-cyan-100"
        >
          {mode === "login" ? "Need account?" : "Have account?"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {mode === "register" ? (
          <label className="grid gap-2 text-sm text-slate-200">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
              placeholder="Your name"
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm text-slate-200">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
            placeholder="name@example.com"
          />
        </label>

        <label className="grid gap-2 text-sm text-slate-200">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0"
            placeholder="Minimum 6 characters"
          />
        </label>

        {error ? <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
        >
          {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
      </div>
    </section>
  );
}
