"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

function NewChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = searchParams.get("agentId");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!agentId) {
      router.push("/");
      return;
    }

    api.sessions
      .create({ mode: "single", agentIds: [agentId] })
      .then((session) => {
        router.push(`/chat/${session.id}`);
      })
      .catch((err) => {
        setError(err.message || "创建会话失败");
      });
  }, [agentId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">创建会话中...</p>
      </div>
    </div>
  );
}

export default function NewChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewChatContent />
    </Suspense>
  );
}
