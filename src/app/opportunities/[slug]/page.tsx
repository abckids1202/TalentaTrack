import { OpportunityDetail } from "@/components/opportunity-detail";

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OpportunityDetail slug={slug} />;
}
