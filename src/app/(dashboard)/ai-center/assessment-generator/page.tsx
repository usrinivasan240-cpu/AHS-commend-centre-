"use client";

import dynamic from "next/dynamic";

const Content = dynamic(() => import("./assessment-generator-content"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="text-sm text-[#64748b]">Loading...</div>
    </div>
  ),
});

export default function AssessmentGeneratorPage() {
  return <Content />;
}
