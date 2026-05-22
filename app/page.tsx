"use client";

import { useEffect, useRef, useState } from "react";

import { Plus, Send, MessageSquare, Sparkles, Menu, X } from "lucide-react";

import { motion } from "framer-motion";

import ReactMarkdown from "react-markdown";

import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

type Message = {
  role: "user" | "assistant";

  content: string;

  metadata?: {
    provider: string;
    model: string;
    latency: number;
    tokens: number;
  };
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");

      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadConversations = async () => {
      await fetchConversations();
    };

    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    setInput("");

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages: updatedMessages,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }

        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: data.message.content,

            metadata: data.message.metadata,
          },
        ]);

        fetchConversations();
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <main className="h-screen bg-black text-white flex overflow-hidden relative">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:relative z-50 md:z-0
          h-full w-[280px] md:w-80
          bg-zinc-950 border-r border-white/10
          flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles size={20} />
              </div>

              <div>
                <h1 className="font-bold text-xl">Ollive AI</h1>

                <p className="text-zinc-400 text-sm">Observability Platform</p>
              </div>
            </div>

            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={22} />
            </button>
          </div>

          <button
            onClick={() => {
              setMessages([]);
              setConversationId(null);
              setSidebarOpen(false);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition p-3 rounded-2xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-cyan-500/20"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.map((conversation) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              key={conversation.id}
              onClick={() => {
                setConversationId(conversation.id);

                setMessages(
                  conversation.messages.map((message) => ({
                    role: message.role as "user" | "assistant",
                    content: message.content,
                  })),
                );

                setSidebarOpen(false);
              }}
              className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <MessageSquare
                  size={18}
                  className="text-cyan-400 flex-shrink-0"
                />

                <span className="truncate text-sm md:text-base">
                  {conversation.title}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </aside>

      {/* MAIN SECTION */}
      <section className="flex-1 flex flex-col bg-gradient-to-br from-black via-zinc-950 to-zinc-900 min-w-0">
        {/* TOP BAR */}
        <div className="border-b border-white/10 p-4 md:p-5 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-30 bg-black/60">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div>
            <h2 className="text-xl md:text-2xl font-bold">AI Assistant</h2>

            <p className="text-zinc-400 text-sm md:text-base">
              Groq-powered observability chat
            </p>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-6 md:py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-16 md:mt-24 px-4"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
                  <Sparkles size={40} />
                </div>

                <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                  Welcome to Ollive AI
                </h2>

                <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto">
                  AI infrastructure + observability assistant
                </p>
              </motion.div>
            )}

            {messages.map((message, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`w-fit max-w-[95%] md:max-w-3xl p-4 md:p-6 rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                      : "bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/40 backdrop-blur-2xl border border-white/10 shadow-2xl"
                  }`}
                >
                  <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-p:text-zinc-200 prose-strong:text-white prose-code:text-cyan-300 prose-p:leading-7 prose-li:leading-7 prose-pre:overflow-x-auto prose-pre:max-w-full text-sm md:text-base break-words">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {message.metadata && (
                    <div className="flex gap-2 mt-5 flex-wrap">
                      <div className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/20">
                        {message.metadata.provider}
                      </div>

                      <div className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/20">
                        {message.metadata.latency}ms
                      </div>

                      <div className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/20">
                        {message.metadata.tokens} tokens
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" />

                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce delay-100" />

                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce delay-200" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* INPUT SECTION */}
        <div className="p-3 md:p-6 border-t border-white/10 backdrop-blur-xl bg-black/30">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-3xl p-2 md:p-3 backdrop-blur-xl shadow-xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent outline-none px-3 py-3 text-white placeholder:text-zinc-500 text-sm md:text-base min-w-0"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-cyan-500/20 flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
