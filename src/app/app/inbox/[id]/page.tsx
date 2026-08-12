import { InboxView } from "../inbox-view";

/** Deep link into a single item, opens the inbox with that drawer already up. */
export default async function FeedbackDeepLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InboxView initialId={id} />;
}
