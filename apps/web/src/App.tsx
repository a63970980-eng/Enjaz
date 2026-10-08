import { Activity, Bot, CheckCircle2, GitBranch, ShieldCheck, Users, Workflow } from "lucide-react";
import { Card } from "./vendor/tremor/components/Card";

const sections = [
  { title: "Command Center", description: "Operational overview and live activity.", icon: Activity },
  { title: "Digital Workforce", description: "AI employees, roles, skills and status.", icon: Users },
  { title: "Tasks", description: "Work assigned across the digital workforce.", icon: CheckCircle2 },
  { title: "Workflows", description: "Visual processes and connected steps.", icon: Workflow },
  { title: "Governance", description: "Approvals, audit and operational control.", icon: ShieldCheck },
];

export default function App() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">ENJAZ</div>
              <div className="text-xs text-white/45">Digital Workforce</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Preview
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-emerald-400">ENJAZ OPERATING CONSOLE</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Enterprise AI Operations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Preview assembled from the open-source enterprise, agent, governance and workflow interfaces collected for ENJAZ.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-white/10 bg-white/[0.045] shadow-none transition hover:border-emerald-400/30 hover:bg-white/[0.07]">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/30">Preview</span>
              </div>
              <h2 className="mt-6 text-lg font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
            </Card>
          ))}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="border-white/10 bg-white/[0.045] shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Workforce workspace</h2>
                <p className="mt-1 text-sm text-white/45">Digital employees and operational work in one place.</p>
              </div>
              <Users className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["AI Manager", "AI Analyst", "AI Operations Worker"].map((name) => (
                <div key={name} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 h-9 w-9 rounded-full bg-emerald-400/15" />
                  <div className="text-sm font-medium">{name}</div>
                  <div className="mt-1 text-xs text-white/35">Digital employee</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-white/10 bg-white/[0.045] shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Workflow</h2>
                <p className="mt-1 text-sm text-white/45">Connected operational steps.</p>
              </div>
              <GitBranch className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="mt-6 space-y-2">
              {["Trigger", "Digital Worker", "Approval", "Execution"].map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-xs text-emerald-300">{i + 1}</div>
                  <span className="text-sm text-white/70">{step}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
