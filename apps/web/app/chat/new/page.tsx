"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

function NewChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMessage = searchParams.get("msg");

  useEffect(() => {
    api.sessions
      .create(initialMessage ? { intent: initialMessage.slice(0, 100) } : undefined)
      .then((session) => {
        if (initialMessage) {
          // Redirect with initial message to be sent in chat page
          router.replace(`/chat/${session.id}?initialMsg=${encodeURIComponent(initialMessage)}`);
        } else {
          router.replace(`/chat/${session.id}`);
        }
      })
      .catch(() => router.push("/"));
  }, [initialMessage, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">准备中...</p>
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
