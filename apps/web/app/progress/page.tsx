"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Lightbulb,
  LineChart,
  Star,
  Target,
  Waves,
} from "lucide-react";

interface TreatmentSession {
  id: string;
  sessionNumber: number;
  presentingProblem?: string | null;
  sessionSummary?: string | null;
  insights?: string[];
  homework?: Array<{ task?: string; completed?: boolean }>;
  skillsIntroduced?: string[];
  allianceRating?: number | null;
  postMood?: {
    selfReport?: MoodPoint;
    extracted?: MoodPoint & {
      primaryEmotions?: string[];
      sleepQuality?: string;
      appetite?: string;
    };
  } | null;
  updatedAt: string;
}

interface MoodPoint {
  moodScore?: number;
  anxietyScore?: number;
  stressScore?: number;
  note?: string;
  submittedAt?: string;
  extractedAt?: string;
}

export default function ProgressPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [caseFormulation, setCaseFormulation] = useState<any>(null);
  const [phq9Trend, setPhq9Trend] = useState<ScalePoint[]>([]);
  const [gad7Trend, setGad7Trend] = useState<ScalePoint[]>([]);
  const [moodScore, setMoodScore] = useState(5);
  const [anxietyScore, setAnxietyScore] = useState(5);
  const [stressScore, setStressScore] = useState(5);
  const [isMoodSaving, setIsMoodSaving] = useState(false);

  useEffect(() => {
    loadRecord();
  }, []);

  const loadRecord = () => {
    api.sessions.list("default").then(setSessions).catch(console.error);
    api.caseFormulations.latest("default").then(setCaseFormulation).catch(() => setCaseFormulation(null));
    api.assessments.trend("PHQ-9").then(setPhq9Trend).catch(console.error);
    api.assessments.trend("GAD-7").then(setGad7Trend).catch(console.error);
  };

  const allInsights = useMemo(
    () => [...new Set(sessions.flatMap((session) => session.insights || []))].slice(0, 8),
    [sessions],
  );

  const skills = useMemo(
    () => [...new Set(sessions.flatMap((session) => session.skillsIntroduced || []))],
    [sessions],
  );

  const homework = useMemo(
    () =>
      sessions
        .flatMap((session) =>
          (session.homework || []).map((item, index) => ({
            ...item,
            sessionId: session.id,
            index,
          })),
        )
        .filter((item) => item?.task)
        .slice(0, 5),
    [sessions],
  );

  const recentSummaries = sessions.filter((session) => session.sessionSummary).slice(0, 4);
  const latestSession = sessions[0];
  const moodTrend = useMemo(
    () =>
      [...sessions]
        .reverse()
        .map((session) => {
          const mood = session.postMood?.selfReport || session.postMood?.extracted;
          if (!mood?.moodScore && mood?.moodScore !== 0) return null;

          return {
            sessionId: session.id,
            label: `S${session.sessionNumber}`,
            moodScore: mood.moodScore,
            anxietyScore: mood.anxietyScore,
            stressScore: mood.stressScore,
            note: mood.note,
          };
        })
        .filter(Boolean)
        .slice(-8) as Array<{
        sessionId: string;
        label: string;
        moodScore: number;
        anxietyScore?: number;
        stressScore?: number;
        note?: string;
      }>,
    [sessions],
  );
  const ratedSessions = sessions.filter((session) => session.allianceRating);
  const averageRating =
    ratedSessions.length > 0
      ? ratedSessions.reduce((sum, session) => sum + (session.allianceRating || 0), 0) / ratedSessions.length
      : 0;

  const completeHomework = async (sessionId: string, index: number) => {
    await api.sessions.updateHomework(sessionId, index, { completed: true });
    loadRecord();
  };

  const submitMood = async () => {
    if (!latestSession || isMoodSaving) return;
    setIsMoodSaving(true);
    try {
      await api.sessions.mood(latestSession.id, {
        moodScore,
        anxietyScore,
        stressScore,
      });
      loadRecord();
    } finally {
      setIsMoodSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">治疗档案</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">我的治疗档案</h1>
          <p className="text-sm text-muted-foreground">
            这里记录对话中逐渐形成的理解、练习和治疗重点。
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">会话</p>
              <p className="mt-1 text-2xl font-semibold">{sessions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">核心洞察</p>
              <p className="mt-1 text-2xl font-semibold">{allInsights.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">帮助感</p>
              <p className="mt-1 flex items-center gap-1 text-2xl font-semibold">
                {averageRating ? averageRating.toFixed(1) : "-"}
                {averageRating > 0 && <Star className="h-4 w-4" />}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              当前治疗重点
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {caseFormulation ? (
              <>
                <RecordRow label="主诉" value={caseFormulation.presentingProblems} />
                <RecordRow label="触发" value={caseFormulation.triggers} />
                <RecordRow label="自动想法" value={caseFormulation.thoughts} />
                <RecordRow label="情绪/身体" value={[caseFormulation.emotions, caseFormulation.physical].filter(Boolean).join("；")} />
                {caseFormulation.coreBeliefs?.length > 0 && (
                  <TagGroup label="可能的核心信念" items={caseFormulation.coreBeliefs} />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">完成几轮对话后，这里会形成初步治疗理解。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="h-4 w-4" />
              情绪追踪
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <ScoreControl label="心情" value={moodScore} onChange={setMoodScore} />
              <ScoreControl label="焦虑" value={anxietyScore} onChange={setAnxietyScore} />
              <ScoreControl label="压力" value={stressScore} onChange={setStressScore} />
            </div>
            <Button onClick={submitMood} disabled={!latestSession || isMoodSaving} size="sm">
              记录这周状态
            </Button>

            {moodTrend.length > 0 ? (
              <div className="space-y-3">
                <div className="flex h-28 items-end gap-2 border-b pb-2">
                  {moodTrend.map((point) => (
                    <div key={point.sessionId} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary/80"
                        style={{ height: `${Math.max(point.moodScore * 10, 6)}%` }}
                        title={`心情 ${point.moodScore}/10`}
                      />
                      <span className="text-[10px] text-muted-foreground">{point.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  柱状越高表示自评心情越好。焦虑和压力会在后续图表中细化。
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">完成一次对话或手动 check-in 后，这里会出现趋势。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-4 w-4" />
              症状量表
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <ScaleTrendCard
                title="PHQ-9 抑郁"
                data={phq9Trend}
                maxScore={27}
                onAssess={() => router.push("/assess?type=PHQ-9")}
              />
              <ScaleTrendCard
                title="GAD-7 焦虑"
                data={gad7Trend}
                maxScore={21}
                onAssess={() => router.push("/assess?type=GAD-7")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              量表不是诊断，只用于观察趋势。建议每 1-2 周做一次。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4" />
              核心洞察
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allInsights.length > 0 ? (
              <div className="space-y-3">
                {allInsights.map((insight) => (
                  <p key={insight} className="rounded-md border px-3 py-2 text-sm leading-relaxed">
                    {insight}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">还没有稳定洞察。先从一次真实对话开始。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              练习记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {homework.length > 0 ? (
              <div className="space-y-2">
                {homework.map((item) => (
                  <div key={`${item.sessionId}-${item.index}`} className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
                    <p className="text-sm leading-relaxed">{item.task}</p>
                    {item.completed ? (
                      <Badge variant="default">已完成</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-shrink-0 px-2"
                        onClick={() => completeHomework(item.sessionId, item.index)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        完成
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">后续会话会自动沉淀轻量练习。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Waves className="h-4 w-4" />
              最近会话摘要
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSummaries.length > 0 ? (
              <div className="space-y-4">
                {recentSummaries.map((session) => (
                  <div key={session.id} className="space-y-1 border-b pb-4 last:border-0 last:pb-0">
                    <p className="text-xs text-muted-foreground">第 {session.sessionNumber} 次对话</p>
                    <p className="text-sm leading-relaxed">{session.sessionSummary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">会话达到足够信息量后会生成摘要。</p>
            )}
          </CardContent>
        </Card>

        {skills.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">已使用技术</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function RecordRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="grid gap-1 sm:grid-cols-[88px_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="leading-relaxed">{value}</span>
    </div>
  );
}

function TagGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ScoreControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

interface ScalePoint {
  score: number;
  date: string;
  severity?: string;
}

function ScaleTrendCard({
  title,
  data,
  maxScore,
  onAssess,
}: {
  title: string;
  data: ScalePoint[];
  maxScore: number;
  onAssess: () => void;
}) {
  const latest = data[data.length - 1];
  const first = data[0];
  const diff = latest && first ? latest.score - first.score : 0;
  const trendLabel =
    data.length < 2 ? "暂无趋势" : diff < 0 ? `下降 ${Math.abs(diff)} 分` : diff > 0 ? `上升 ${diff} 分` : "基本稳定";

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{trendLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{latest ? latest.score : "-"}</p>
          <p className="text-xs text-muted-foreground">分</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="flex h-20 items-end gap-1 border-b pb-1">
          {data.slice(-8).map((point) => (
            <div key={`${point.date}-${point.score}`} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-muted-foreground/60"
                style={{ height: `${Math.max((point.score / maxScore) * 100, 6)}%` }}
                title={`${point.date}：${point.score} 分`}
              />
              <span className="text-[9px] text-muted-foreground">{point.date.slice(5)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
          暂无量表数据
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={onAssess}>
        {latest ? "再次评估" : "开始评估"}
      </Button>
    </div>
  );
}
