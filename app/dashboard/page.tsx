"use client";

import { useEffect, useState } from "react";
import { Activity, Brain, Clock3, MessagesSquare } from "lucide-react";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { motion } from "framer-motion";

type Log = {
  id: string;
  provider: string;
  model: string;
  latencyMs: number;
  totalTokens: number;
  status: string;
  createdAt: string;
};

type DashboardData = {
  stats: {
    conversations: number;
    messages: number;
    totalTokens: number;
    averageLatency: number;
  };
  logs: Log[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await fetch("/api/dashboard");

      const result = await response.json();

      setData(result);
    };

    fetchDashboard();
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Dashboard...
      </div>
    );
  }

  const chartData = data.logs.map((log, index) => ({
    name: `#${index + 1}`,
    latency: log.latencyMs,
    tokens: log.totalTokens,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-300 text-transparent bg-clip-text">
            Ollive AI Observability
          </h1>

          <p className="text-zinc-400 text-lg">
            AI Infrastructure Monitoring Platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <Card
            title="Conversations"
            value={data.stats.conversations}
            icon={<MessagesSquare />}
          />

          <Card title="Messages" value={data.stats.messages} icon={<Brain />} />

          <Card
            title="Total Tokens"
            value={data.stats.totalTokens}
            icon={<Activity />}
          />

          <Card
            title="Avg Latency"
            value={`${Math.round(data.stats.averageLatency)}ms`}
            icon={<Clock3 />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="xl:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
          >
            <h2 className="text-2xl font-semibold mb-6">Latency Analytics</h2>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
          >
            <h2 className="text-2xl font-semibold mb-6">System Health</h2>

            <div className="space-y-6">
              <HealthCard label="API Status" value="Operational" />

              <HealthCard label="LLM Provider" value="Groq" />

              <HealthCard label="Database" value="Connected" />

              <HealthCard label="Observability" value="Active" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
        >
          <h2 className="text-2xl font-semibold mb-6">Recent Inference Logs</h2>

          <div className="space-y-4">
            {data.logs.map((log) => (
              <div
                key={log.id}
                className="border border-white/10 rounded-2xl p-5 bg-black/30 hover:bg-black/50 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{log.model}</h3>

                    <p className="text-zinc-400">Provider: {log.provider}</p>

                    <p className="text-green-400">{log.status}</p>
                  </div>

                  <div className="flex gap-8">
                    <div>
                      <p className="text-zinc-500 text-sm">Latency</p>

                      <p className="text-xl font-bold">{log.latencyMs}ms</p>
                    </div>

                    <div>
                      <p className="text-zinc-500 text-sm">Tokens</p>

                      <p className="text-xl font-bold">{log.totalTokens}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="text-zinc-400">{title}</div>

        <div className="text-blue-400">{icon}</div>
      </div>

      <div className="text-4xl font-bold">{value}</div>
    </motion.div>
  );
}

function HealthCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 rounded-2xl p-4 bg-black/30">
      <p className="text-zinc-500 text-sm mb-1">{label}</p>

      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
