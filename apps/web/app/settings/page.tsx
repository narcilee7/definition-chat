"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowLeft,
  Download,
  FileText,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Siren,
} from "lucide-react";

const CRISIS_RESOURCES = [
  { name: "全国希望 24 热线", phone: "400-161-9995" },
  { name: "北京心理危机干预中心", phone: "010-82951332" },
  { name: "生命热线", phone: "400-821-1215" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    try {
      const [sessions, assessments, caseFormulation, safetyPlan] = await Promise.all([
        api.sessions.list("default").catch(() => []),
        api.assessments.list().catch(() => []),
        api.caseFormulations.latest("default").catch(() => null),
        api.safety.get("default").catch(() => null),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        userId: "default",
        sessions,
        assessments,
        caseFormulation,
        safetyPlan,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ohme-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
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
            <span className="text-sm font-medium">设置</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">设置与边界</h1>
          <p className="text-sm text-muted-foreground">
            OhMe 提供结构化心理支持，但不替代持证咨询师、精神科医生或紧急危机服务。
          </p>
        </section>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartHandshake className="h-4 w-4" />
              服务边界
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>OhMe 是 AI 驱动的结构化心理支持工具，不提供精神疾病诊断，不开具药物或医疗建议。</p>
            <p>如果你正在经历强烈自伤、自杀念头，或担心自己可能伤害自己，请优先联系真人危机资源或当地急救服务。</p>
            <p>AI 回复可能出错。重要决定、用药、诊断和危机处置应交由专业人员评估。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              隐私与数据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>你的会话、评估、练习和安全计划会用于生成治疗档案，并帮助 AI 在后续对话中保持连续理解。</p>
            <p>当前版本默认使用本地开发用户 `default`。上线前需要接入真实账号、同意记录、数据保留策略和删除流程。</p>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">导出我的数据</p>
                <p className="text-xs text-muted-foreground">包含会话、量表、个案概念化和安全计划。</p>
              </div>
              <Button onClick={exportData} disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                导出 JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Siren className="h-4 w-4" />
              危机资源
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CRISIS_RESOURCES.map((resource) => (
              <a
                key={resource.phone}
                href={`tel:${resource.phone}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <span>{resource.name}</span>
                <span className="font-medium">{resource.phone}</span>
              </a>
            ))}
            <Button variant="outline" className="mt-2 w-full" onClick={() => router.push("/safety")}>
              打开安全计划
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              治疗记录
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => router.push("/progress")}>
              查看治疗档案
            </Button>
            <Button variant="outline" onClick={() => router.push("/assess")}>
              打开量表评估
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
