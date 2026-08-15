import { DraftsExplorer } from "@/components/DraftsExplorer";
import { DRAFT_TEMPLATES } from "@/lib/drafts";

export default function DraftsPage() {
  return <DraftsExplorer templates={DRAFT_TEMPLATES} />;
}
