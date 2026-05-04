"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { useAgents } from "@/hooks/use-agents";
import { useSessions } from "@/hooks/use-sessions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Plus, Bot, Sparkles } from "lucide-react";

export default function HomePage() {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            你的内在人格工坊
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            构建不同人格的Agent，与它们对话，探索自我、疗愈内心、解决问题
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5" />
                我的Agent
              </h2>
              <Link href="/build">
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  新建
                </Button>
              </Link>
            </div>

            {agentsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {agents?.map((agent) => (
                  <Card key={agent.id} className="group overflow-hidden transition-all hover:shadow-md">
                    <div className="h-1" style={{ backgroundColor: agent.color }} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {agent.isBuiltIn ? (
                              <Badge variant="secondary" className="text-[10px]">内置</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">自定义</Badge>
                            )}
                          </CardDescription>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: agent.color }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {agent.description}
                      </p>
                      <Link href={`/chat/new?agentId=${agent.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1 transition-colors"
                          style={{ ["--hover-bg" as string]: agent.color }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          开始对话
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              最近对话
            </h2>

            <ScrollArea className="h-[400px] rounded-xl border">
              <div className="p-3 space-y-2">
                {sessionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 rounded-lg">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  sessions.map((session) => (
                    <Link key={session.id} href={`/chat/${session.id}`}>
                      <div className="p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(session.updatedAt).toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    还没有对话记录
                    <br />
                    选择一个Agent开始吧
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
}
