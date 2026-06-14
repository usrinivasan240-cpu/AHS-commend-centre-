"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpRight,
  Wallet,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const statusVariant: Record<string, "success" | "default" | "danger" | "secondary" | "warning"> = {
  paid: "success",
  sent: "default",
  overdue: "danger",
  draft: "secondary",
};

export default function FinanceDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: invoices, loading: invoicesLoading } = useFirestoreQuery(COLLECTIONS.INVOICES);
  const { data: clients, loading: clientsLoading } = useFirestoreQuery(COLLECTIONS.CLIENTS);

  const loading = invoicesLoading || clientsLoading;

  const financeSummary = useMemo(() => {
    const totalRevenue = invoices
      .filter((i: any) => i.status === "paid")
      .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
    const pendingAmount = invoices
      .filter((i: any) => i.status === "sent" || i.status === "overdue")
      .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
    const totalExpenses = totalRevenue * 0.6;
    return {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      pendingInvoices: invoices.filter((i: any) => i.status === "sent" || i.status === "overdue").length,
    };
  }, [invoices]);

  const chartData = useMemo(() => {
    return months.map((month, i) => ({
      name: month,
      revenue: Math.round(financeSummary.totalRevenue * (0.1 + i * 0.15)),
      expenses: Math.round(financeSummary.totalExpenses * (0.1 + i * 0.15)),
    }));
  }, [financeSummary]);

  const paymentStatusData = useMemo(() => [
    { name: "Paid", value: invoices.filter((i: any) => i.status === "paid").length, color: "#10b981" },
    { name: "Sent", value: invoices.filter((i: any) => i.status === "sent").length, color: "#0066ff" },
    { name: "Overdue", value: invoices.filter((i: any) => i.status === "overdue").length, color: "#ef4444" },
    { name: "Draft", value: invoices.filter((i: any) => i.status === "draft").length, color: "#64748b" },
  ], [invoices]);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(financeSummary.totalRevenue),
      change: "+18.2%",
      trend: "up" as const,
      icon: IndianRupee,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(financeSummary.totalExpenses),
      change: "+12.5%",
      trend: "up" as const,
      icon: CreditCard,
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
    {
      label: "Profit",
      value: formatCurrency(financeSummary.profit),
      change: "+24.8%",
      trend: "up" as const,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Pending Invoices",
      value: financeSummary.pendingInvoices.toString(),
      change: "3 due soon",
      trend: "down" as const,
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const getClientName = (clientId: string) => {
    return clients.find((c: any) => c.id === clientId)?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading finance data...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Finance <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="mt-1 text-muted">Track revenue, expenses, and financial health</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger" />
                    )}
                    <span className={stat.trend === "up" ? "text-success" : "text-danger"}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Monthly Revenue vs Expenses Chart */}
              <motion.div variants={fadeInUp} className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Revenue vs Expenses
                    </CardTitle>
                    <Badge variant="outline">Last 6 months</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={{ stroke: "#1e293b" }}
                          />
                          <YAxis
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={{ stroke: "#1e293b" }}
                            tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid #1e293b",
                              borderRadius: "8px",
                              color: "#e2e8f0",
                            }}
                            formatter={(value) => [formatCurrency(Number(value)), ""]}
                          />
                          <Legend
                            wrapperStyle={{ color: "#64748b" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Revenue"
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Expenses"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Status Pie Chart */}
              <motion.div variants={fadeInUp}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="h-5 w-5 text-secondary" />
                      Payment Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {paymentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid #1e293b",
                              borderRadius: "8px",
                              color: "#e2e8f0",
                            }}
                          />
                          <Legend
                            wrapperStyle={{ color: "#64748b", fontSize: "12px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Recent Invoices
                </CardTitle>
                <Link href="/finance/invoices">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{invoice.id}</p>
                          <p className="text-sm text-muted">
                            {getClientName(invoice.clientId)} • Due {formatDate(invoice.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-white">{formatCurrency(invoice.amount)}</p>
                        <Badge variant={statusVariant[invoice.status]}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                            color: "#e2e8f0",
                          }}
                          formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingDown className="h-5 w-5 text-danger" />
                    Monthly Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                            color: "#e2e8f0",
                          }}
                          formatter={(value) => [formatCurrency(Number(value)), "Expenses"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
