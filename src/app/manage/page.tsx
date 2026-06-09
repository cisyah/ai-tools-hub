import { Suspense } from "react";
import { ManageClient } from "@/components/ManageClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ManageClient />
    </Suspense>
  );
}
