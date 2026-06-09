import { Suspense } from "react";
import { TagsClient } from "@/components/TagsClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TagsClient />
    </Suspense>
  );
}
