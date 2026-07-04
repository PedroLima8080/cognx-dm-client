"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TrainView from "@/components/TrainView";
import { Loading, Empty } from "@/components/Bits";

function Inner() {
  const id = useSearchParams().get("id");
  if (!id) return <Empty text="Conversa não encontrada." />;
  return <TrainView conversationId={id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Inner />
    </Suspense>
  );
}
