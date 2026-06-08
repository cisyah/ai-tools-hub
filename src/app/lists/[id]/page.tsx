import { ListDetailClient } from "@/components/ListDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ListDetailClient id={id} />;
}
