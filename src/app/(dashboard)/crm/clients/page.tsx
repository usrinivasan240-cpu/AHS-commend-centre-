"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Building2,
  Mail,
  Phone,
  IndianRupee,
  FolderKanban,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { clients } from "@/lib/mock-data";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [search, statusFilter]);

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          <span className="gradient-text">Clients</span>
        </h1>
        <p className="mt-1 text-muted">
          {clients.length} client{clients.length !== 1 ? "s" : ""} • Total revenue:{" "}
          {formatCurrency(totalRevenue)}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Client Cards Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <AnimatePresence>
          {filteredClients.map((client) => {
            const isExpanded = expandedId === client.id;
            return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={cn(
                    "card-hover transition-all",
                    isExpanded && "ring-2 ring-primary/30"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">{client.name}</h3>
                          <Badge
                            variant={client.status === "active" ? "success" : "secondary"}
                            className="text-[10px] capitalize"
                          >
                            {client.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{client.company}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Since {formatDate(client.since)}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span>
                          {client.projects.length} project
                          {client.projects.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(client.totalRevenue)}
                      </span>
                    </div>

                    {/* Expandable Details */}
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? "auto" : 0 }}
                      className="overflow-hidden"
                    >
                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          <Separator />
                          <div>
                            <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                              Projects
                            </h4>
                            <div className="space-y-1.5">
                              {client.projects.map((project, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-1.5 text-sm"
                                >
                                  <FolderKanban className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-[#e2e8f0]">{project}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-md bg-card-hover/50 p-3 text-center">
                              <p className="text-lg font-bold text-white">
                                {formatCurrency(client.totalRevenue)}
                              </p>
                              <p className="text-[10px] text-muted uppercase">Revenue</p>
                            </div>
                            <div className="rounded-md bg-card-hover/50 p-3 text-center">
                              <p className="text-lg font-bold text-white">
                                {client.projects.length}
                              </p>
                              <p className="text-[10px] text-muted uppercase">Projects</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-4 gap-1"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : client.id)
                      }
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Details
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredClients.length === 0 && (
        <div className="py-12 text-center text-muted">No clients found.</div>
      )}
    </motion.div>
  );
}
