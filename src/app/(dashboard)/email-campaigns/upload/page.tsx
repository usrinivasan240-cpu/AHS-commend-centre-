"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
export default function UploadLeadsPage(){
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Upload Leads</h1>
      <Card>
        <CardHeader><CardTitle>Upload Excel / CSV</CardTitle><p className="text-xs text-muted-foreground">Supports .xlsx, .xls, .csv -- intelligently maps columns, validates, previews before approval. Use Create Campaign for full workflow.</p></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Go to Create Campaign to upload with full validation flow (Upload - Validate - Preview - Approve - Send).</p>
          <Link href="/email-campaigns/create"><Button><Upload className="h-4 w-4 mr-2"/> Go to Create Campaign</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}