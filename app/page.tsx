"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Home just forwards to the pending queue.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/pendentes/");
  }, [router]);
  return <div className="py-10 text-center text-sm text-neutral-500">Carregando...</div>;
}
