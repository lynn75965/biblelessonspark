import { Header } from "@/components/layout/Header";
import { SetupChecklist as SetupChecklistComponent } from "@/components/setup/SetupChecklist";

export default function SetupChecklist() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <SetupChecklistComponent />
      </main>
    </div>
  );
}
