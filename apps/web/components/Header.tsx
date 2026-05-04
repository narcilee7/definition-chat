"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          OhMe
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">我的Agent</Button>
          </Link>
          <Link href="/build">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              新建Agent
            </Button>
          </Link>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
