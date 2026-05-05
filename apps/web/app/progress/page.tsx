"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function ProgressPage() {
  const router = useRouter();
  const [phq9Trend, setPhq9Trend] = useState<any[]>([]);
  const [gad7Trend, setGad7Trend] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api.assessments.trend("PHQ-9").then(setPhq9Trend).catch(console.error);
    api.assessments.trend("GAD-7").then(setGad7Trend).catch(console.error);
    api.sessions.list().then(setSessions).catch(console.error);
  }, []);

  const getTrendIcon = (scores: number[]) => {
    if (scores.length < 2) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const diff = scores[scores.length - 1] - scores[0];
    if (diff < -3) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (diff > 3) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const renderMiniChart = (data: any[], color: string) => {
    if (data.length === 0) return <p className="text-sm text-muted-foreground">暂无数据</p>;
    const max = Math.max(...data.map((d) => d.score), 27);
    const min = Math.min(...data.map((d) => d.score), 0);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => {
          const height = ((d.score - min) / range) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${Math.max(height, 5)}%`, backgroundColor: color }}
              />
              <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">进度追踪</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">你的治疗旅程</h1>
          <p className="text-muted-foreground text-sm">追踪症状变化和治疗进展</p>
        </div>

        {/* PHQ-9 Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">PHQ-9 抑郁趋势</CardTitle>
              {getTrendIcon(phq9Trend.map((d) => d.score))}
            </div>
          </CardHeader>
          <CardContent>{renderMiniChart(phq9Trend, "#2563EB")}</CardContent>
        </Card>

        {/* GAD-7 Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">GAD-7 焦虑趋势</CardTitle>
              {getTrendIcon(gad7Trend.map((d) => d.score))}
            </div>
          </CardHeader>
          <CardContent>{renderMiniChart(gad7Trend, "#7C3AED")}</CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">会话统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">总会话数</span>
              <span className="font-medium">{sessions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">治疗师</span>
              <span className="font-medium">
                {sessions.length > 0
                  ? [...new Set(sessions.map((s) => s.therapist?.name))].join("、")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">学习技能</span>
              <span className="font-medium">
                {[
                  ...new Set(sessions.flatMap((s) => s.skillsIntroduced || [])),
                ].length}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
