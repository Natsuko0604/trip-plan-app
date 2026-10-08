import { PlanForm } from "@/features/plans/components/plan-form";

export default function NewPlanPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f6]">
      <header className="border-b border-neutral-200 bg-white px-5 py-4 text-center">
        <h1 className="text-xl font-bold text-neutral-900">旅行計画を作成</h1>
      </header>
      <PlanForm />
    </main>
  );
}
