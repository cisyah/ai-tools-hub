import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="page-shell text-sm text-muted-foreground">Loading…</div>}>
      <HomeClient />
    </Suspense>
  );
}
