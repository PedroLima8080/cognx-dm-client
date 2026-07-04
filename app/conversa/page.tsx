"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ThreadView from "@/components/ThreadView";
import { Loading, Empty } from "@/components/Bits";

// The conversation id travels as a query string (?id=...), because this is a
// static export and a real /conversa/[id]/ segment can't be prerendered for
// runtime database ids. useSearchParams must sit inside <Suspense>.
function Inner() {
  const id = useSearchParams().get("id");
  if (!id) return <Empty text="Conversa não encontrada." />;
  return <ThreadView conversationId={id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Inner />
    </Suspense>
  );
}
