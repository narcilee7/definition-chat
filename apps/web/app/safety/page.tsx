"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, Phone, Shield, AlertTriangle, Loader2 } from "lucide-react";

const CRISIS_RESOURCES = [
  { name: "全国希望 24 热线", phone: "400-161-9995", description: "24 小时危机干预" },
  { name: "北京心理危机干预中心", phone: "010-82951332", description: "24 小时专业支持" },
  { name: "生命热线", phone: "400-821-1215", description: "情绪支持热线" },
];

interface SafetyPlan {
  warningSigns: string[];
  copingStrategies: string[];
  distractions: string[];
  supportPeople: Array<{ name: string; phone: string; relationship: string }>;
  professionals: Array<{ name: string; phone: string; role: string }>;
}

export default function SafetyPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<SafetyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    api.safety.get("default")
      .then((data) => setPlan(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!plan) return;
    setIsSaving(true);
    try {
      await api.safety.save("default", plan);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = (category: keyof SafetyPlan, item: string) => {
    if (!item.trim() || !plan) return;
    setPlan((prev) => prev && ({ ...prev, [category]: [...(prev[category] as string[]), item.trim()] }));
  };

  const handleRemoveItem = (category: keyof SafetyPlan, index: number) => {
    if (!plan) return;
    setPlan((prev) => prev && ({ ...prev, [category]: (prev[category] as string[]).filter((_, i) => i !== index) }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">安全中心</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">如果你正处于危机中</span>
          </div>
          <p className="text-sm text-red-600 mb-3">请立即拨打以下热线。你不是一个人，有人愿意帮助你。</p>
          <div className="space-y-2">
            {CRISIS_RESOURCES.map((r) => (
              <a key={r.phone} href={`tel:${r.phone}`} className="flex items-center justify-between p-3 bg-white dark:bg-red-950/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-bold">{r.phone}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">我的安全计划</h2>
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                保存
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "取消" : "编辑"}
            </Button>
          </div>
        </div>

        <SafetyPlanCard title="1. 我的警告信号" subtitle="当我开始感到崩溃时，第一个信号是什么？"
          items={plan.warningSigns} isEditing={isEditing} onRemove={(i) => handleRemoveItem("warningSigns", i)} onAdd={(item) => handleAddItem("warningSigns", item)} />
        <SafetyPlanCard title="2. 我自己可以做什么" subtitle="在危机时刻，我自己可以做什么来安抚自己？"
          items={plan.copingStrategies} isEditing={isEditing} onRemove={(i) => handleRemoveItem("copingStrategies", i)} onAdd={(item) => handleAddItem("copingStrategies", item)} />
        <SafetyPlanCard title="3. 分散注意力" subtitle="有什么地方或活动可以暂时分散注意力？"
          items={plan.distractions} isEditing={isEditing} onRemove={(i) => handleRemoveItem("distractions", i)} onAdd={(item) => handleAddItem("distractions", item)} />

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">4. 我可以联系的人</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">在危机时，我可以联系谁？</p>
            {plan.supportPeople.map((person, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg space-y-2">
                {isEditing ? (
                  <>
                    <Input placeholder="姓名" defaultValue={person.name} onChange={(e) => {
                      const updated = [...plan.supportPeople];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setPlan({ ...plan, supportPeople: updated });
                    }} />
                    <Input placeholder="电话" defaultValue={person.phone} onChange={(e) => {
                      const updated = [...plan.supportPeople];
                      updated[i] = { ...updated[i], phone: e.target.value };
                      setPlan({ ...plan, supportPeople: updated });
                    }} />
                    <Input placeholder="关系" defaultValue={person.relationship} onChange={(e) => {
                      const updated = [...plan.supportPeople];
                      updated[i] = { ...updated[i], relationship: e.target.value };
                      setPlan({ ...plan, supportPeople: updated });
                    }} />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">{person.name || "（未填写）"}</p>
                    {person.phone && <a href={`tel:${person.phone}`} className="text-sm text-primary flex items-center gap-1"><Phone className="h-3 w-3" />{person.phone}</a>}
                    {person.relationship && <p className="text-xs text-muted-foreground">{person.relationship}</p>}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function SafetyPlanCard({ title, subtitle, items, isEditing, onRemove, onAdd }: {
  title: string; subtitle: string; items: string[]; isEditing: boolean;
  onRemove: (index: number) => void; onAdd: (item: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-sm">{item}</span>
            {isEditing && <Button variant="ghost" size="sm" onClick={() => onRemove(i)}>删除</Button>}
          </div>
        ))}
        {isEditing && (
          <div className="flex gap-2">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="添加新项目..." className="flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") { onAdd(value); setValue(""); } }} />
            <Button size="sm" onClick={() => { onAdd(value); setValue(""); }}>添加</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
