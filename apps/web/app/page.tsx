"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { Sparkles, MessageCircle, Wand2, Loader2, ClipboardCheck, Shield, BarChart3, Split } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  description: string;
  approach: { displayName: string; name: string };
  voiceTone: string;
  specialties: string[];
}

const toneLabels: Record<string, string> = {
  gentle_direct: "温和直接",
  warm_accepting: "温暖接纳",
  sharp_challenging: "犀利挑战",
  poetic_intuitive: "诗意直觉",
};

export default function HomePage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  useEffect(() => {
    api.personas.list().then(setPersonas).catch(console.error);
    api.sessions.list().then(setSessions).catch(console.error);
  }, []);

  const handleStart = async () => {
    if (!selectedPersona || isLoading) return;
    setIsLoading(true);
    try {
      const session = await api.therapy.createSession({
        userId: "default",
        therapistId: selectedPersona,
      });
      router.push(`/chat/${session.sessionId}`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const approachColors: Record<string, string> = {
    cbt: "bg-blue-500",
    dbt: "bg-violet-500",
    act: "bg-emerald-500",
    psychodynamic: "bg-gray-500",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            OhMe
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/build")}>
              <Wand2 className="h-4 w-4 mr-1" />
              创建咨询师
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Hero */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            选择你的咨询师
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            每位咨询师有不同的流派和风格。选择最让你感到舒服的，开始你的治疗旅程。
          </p>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {personas.map((persona) => (
            <Card
              key={persona.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPersona === persona.id
                  ? "ring-2 ring-primary border-primary"
                  : ""
              }`}
              onClick={() => setSelectedPersona(persona.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${approachColors[persona.approach.name] || "bg-primary"}`} />
                  <CardTitle className="text-base">{persona.name}</CardTitle>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {persona.approach.displayName}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{persona.description}</p>
                <div className="flex flex-wrap gap-1">
                  {persona.specialties.map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  风格：{toneLabels[persona.voiceTone] || persona.voiceTone}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Button variant="outline" onClick={() => router.push("/assess")} className="h-auto py-3 flex-col gap-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-xs">量表评估</span>
          </Button>
          <Button variant="outline" onClick={() => router.push("/reflect")} className="h-auto py-3 flex-col gap-1">
            <Split className="h-4 w-4" />
            <span className="text-xs">流派折射</span>
          </Button>
          <Button variant="outline" onClick={() => router.push("/progress")} className="h-auto py-3 flex-col gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">进度追踪</span>
          </Button>
          <Button variant="outline" onClick={() => router.push("/safety")} className="h-auto py-3 flex-col gap-1">
            <Shield className="h-4 w-4" />
            <span className="text-xs">安全中心</span>
          </Button>
        </div>

        {/* Start Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!selectedPersona || isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MessageCircle className="h-4 w-4 mr-2" />
            )}
            开始会话
          </Button>
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              继续探索
            </h2>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  onClick={() => router.push(`/chat/${session.id}`)}
                  className="w-full text-left p-3 rounded-xl bg-muted/50 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      第 {session.sessionNumber} 次会话
                      {session.therapist && (
                        <span className="text-muted-foreground ml-2">
                          · {session.therapist.name}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  {session.insights && session.insights.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {session.insights[session.insights.length - 1]}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
