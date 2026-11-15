import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getProposals } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { ProposalsView } from "@/components/proposals/proposals-view";

export const metadata: Metadata = { title: "الاقتراحات" };
export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const user = await requirePermission("proposals.view");
  const proposals = await getProposals(user.id);
  const categories = Array.from(new Set(proposals.map((proposal) => proposal.category)));

  return (
    <ProposalsView
      proposals={proposals}
      categories={categories}
      canCreate={hasPermission(user.permissions, "proposals.create")}
      canVote={hasPermission(user.permissions, "proposals.vote")}
      canReview={hasPermission(user.permissions, "proposals.review")}
      canConvert={hasPermission(user.permissions, "proposals.convert")}
    />
  );
}
