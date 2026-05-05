"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

function NewChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const presentingProblem = searchParams.get("q") || "";

  useEffect(() => {
    const createSession = async () => {
      try {
        // 获取默认治疗师
        const personas = await api.personas.list();
        const defaultTherapist = personas.find((p: any) => p.isBuiltIn) || personas[0];
        if (!defaultTherapist) throw new Error("没有可用的咨询师");

        // 创建会话
        const session = await api.therapy.createSession({
          userId: "default",
          therapistId: defaultTherapist.id,
          presentingProblem: presentingProblem || undefined,
        });

        // 跳转到对话
        router.replace(`/chat/${session.sessionId}`);
      } catch (err) {
        console.error("Failed to create session:", err);
        setError(err instanceof Error ? err.message : "创建会话失败");
      }
    };

    createSession();
  }, [router, presentingProblem]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-primary underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">
          {presentingProblem ? "正在准备对话..." : "准备中..."}
        </p>
      </div>
    </div>
  );
}

export default function NewChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">准备中...</p>
          </div>
        </div>
      }
    >
      <NewChatContent />
    </Suspense>
  );
}
