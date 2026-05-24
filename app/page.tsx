"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Send, MessageSquare, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { SignInButton, useClerk, useUser, UserButton } from "@clerk/nextjs";
import { decode } from "html-entities";
import UploadDocument from "@/components/UploadDocument";
import { LogIn } from "lucide-react";
import {
  Copy,
  Check,
  MoreVertical,
  Search,
  Pin,
  Trash2,
  Pencil,
} from "lucide-react";

import "highlight.js/styles/github-dark.css";

type Message = {
  role: "user" | "assistant";
  content: string;
  model?: string;
  metadata?: { provider: string; latency: number; tokens: number };
};

type Conversation = {
  _id?: string;
  id?: string;
  title: string;
  messages: Message[];
  pinned?: boolean;
};

export default function Home() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeConversation = conversations.find(
    (c) =>
      String(c._id) === String(conversationId) ||
      String(c.id) === String(conversationId),
  );

  const messages = activeConversation?.messages || [];
  const loadConversation = (conversation: Conversation) => {
    if (conversation.messages) {
    }
    setConversationId(String(conversation._id || conversation.id || ""));
  };
  const filteredConversations = conversations
    .filter(
      (conv) =>
        conv &&
        (conv.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const aPinned = a.pinned;
      const bPinned = b.pinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  const fetchConversations = async () => {
    try {
      console.log("FETCHING CHATS");
      const response = await fetch("/api/conversations");

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();

      const validConversations = (data.conversations || []).filter(
        (conv: Conversation) =>
          conv && conv.title && Array.isArray(conv.messages),
      );

      setConversations(validConversations);

      // RESTORE SAVED CHAT
      const savedConversationId = localStorage.getItem("conversationId");

      if (savedConversationId) {
        const activeConversation = validConversations.find(
          (c: Conversation) => String(c._id) === String(savedConversationId),
        );

        if (activeConversation) {
          setConversationId(String(activeConversation._id));
          setHasRestored(true);
        }
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const loadData = async () => {
      await fetchConversations();
    };

    loadData();
  }, [isLoaded, isSignedIn, user?.id]);

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

    const currentMessages = activeConversation?.messages || [];

    const updatedMessages = [...currentMessages, userMessage];

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
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        console.error("API Error:", response.status);

        setLoading(false);

        return;
      }

      const reader = response.body?.getReader();

      if (!reader) return;

      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = new TextDecoder().decode(value);

        assistantText += chunk;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantText,
      };
      const savedResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: conversationId,

          title: updatedMessages[0]?.content.slice(0, 30) || "New Chat",

          messages: [...updatedMessages, assistantMessage],

          pinned: false,
        }),
      });

      const savedData = await savedResponse.json();

      if (!savedData?.conversation) {
        console.error("Conversation save failed", savedData);
        setLoading(false);
        return;
      }

      const newConversation = savedData.conversation;

      setConversations((prev) => {
        const exists = prev.find(
          (c) => String(c._id) === String(newConversation._id),
        );

        if (exists) {
          return prev.map((c) =>
            String(c._id) === String(newConversation._id) ? newConversation : c,
          );
        }

        return [newConversation, ...prev];
      });

      console.log("Conversation saved");

      if (newConversation?._id) {
        setConversationId(String(newConversation._id));
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const exportChat = () => {
    const content = messages
      .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
      .join("\n\n");

    const blob = new Blob([content], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "ollive-chat.txt";

    a.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem("conversationId", conversationId);
    }
  }, [conversationId]);
  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);

    setCopiedIndex(index);

    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
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
          h-full w-[220px] md:w-64
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
              if (!hasRestored) return;
              setConversationId("");
              setInput("");

              localStorage.removeItem("conversationId");
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition p-3 rounded-2xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-cyan-500/20"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>
        <div className="px-5 pb-4">
          {" "}
          <div className="relative">
            {" "}
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />{" "}
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-cyan-500"
            />{" "}
          </div>{" "}
        </div>
        <div className="flex-1 overflow-visible p-3 space-y-2">
          {" "}
          {filteredConversations.map((conversation) => {
            const conversationKey = conversation._id || conversation.id || "";
            return (
              <motion.div
                key={conversationKey}
                style={{ overflow: "visible" }}
                className="relative w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition"
              >
                {" "}
                <div className="flex items-center justify-between w-full">
                  {" "}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversationId(String(conversationKey));
                      setSidebarOpen(false);
                    }}
                    className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                  >
                    {" "}
                    <MessageSquare
                      size={18}
                      className="text-cyan-400 flex-shrink-0"
                    />{" "}
                    <div className="flex items-center gap-2 min-w-0">
                      {" "}
                      {conversation.pinned && (
                        <Pin
                          size={14}
                          className="text-yellow-400 flex-shrink-0"
                        />
                      )}{" "}
                      <span className="truncate text-xs md:text-sm">
                        {" "}
                        {conversation.title}{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="relative z-50">
                    {" "}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === conversationKey
                            ? null
                            : conversationKey,
                        );
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                    >
                      {" "}
                      <MoreVertical size={16} />{" "}
                    </div>{" "}
                    {openMenuId === conversationKey && (
                      <div className="absolute right-0 top-12 w-44 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                        {" "}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();

                            const newTitle = prompt(
                              "Rename chat",
                              conversation.title,
                            );

                            if (!newTitle) return;

                            try {
                              await fetch("/api/conversations", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  mongoId: conversation._id,
                                  title: newTitle,
                                  messages: conversation.messages,
                                  pinned: conversation.pinned,
                                }),
                              });

                              setConversations((prev) =>
                                prev.map((c) =>
                                  c._id === conversation._id
                                    ? {
                                        ...c,
                                        title: newTitle,
                                      }
                                    : c,
                                ),
                              );

                              setOpenMenuId(null);
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm"
                        >
                          {" "}
                          <Pencil size={16} /> Rename{" "}
                        </button>{" "}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();

                            try {
                              const updatedPinned = !conversation.pinned;

                              const response = await fetch(
                                "/api/conversations",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    mongoId: conversation._id,

                                    title: conversation.title,

                                    messages: conversation.messages,

                                    pinned: updatedPinned,
                                  }),
                                },
                              );

                              const data = await response.json();

                              setConversations((prev) =>
                                prev.map((c) =>
                                  c._id === conversation._id
                                    ? data.conversation
                                    : c,
                                ),
                              );

                              setOpenMenuId(null);
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm"
                        >
                          {" "}
                          <Pin size={16} />{" "}
                          {conversation.pinned ? "Unpin Chat" : "Pin Chat"}{" "}
                        </button>{" "}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();

                            try {
                              await fetch(
                                `/api/conversations?id=${conversation._id}`,
                                {
                                  method: "DELETE",
                                },
                              );

                              setConversations((prev) =>
                                prev.filter((c) => c._id !== conversation._id),
                              );

                              if (conversationId === conversation._id) {
                                setConversationId("");
                              }

                              setOpenMenuId(null);
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 text-red-400 text-sm"
                        >
                          {" "}
                          <Trash2 size={16} /> Delete{" "}
                        </button>{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
              </motion.div>
            );
          })}{" "}
        </div>
      </aside>

      {/* MAIN SECTION */}
      <section className="flex-1 flex flex-col bg-gradient-to-br from-black via-zinc-950 to-zinc-900 min-w-0">
        {/* TOP BAR */}
        <div className="flex items-start justify-between w-full mb-6 pt-6 pr-6">
          <div>
            <h1 className="text-3xl font-bold leading-tight">AI Assistant</h1>

            <p className="text-zinc-400 leading-tight mt-1">
              Groq-powered observability chat
            </p>
          </div>

          <div className="flex items-center gap-6">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-0 hover:bg-cyan-400 text-white text-sm font-medium transition">
                  <LogIn size={16} />
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-0 hover:bg-red-400 text-white text-sm font-medium transition"
                >
                  <LogIn size={16} />
                  Sign Out
                </button>

                <UserButton
                  appearance={{
                    elements: {
                      userButtonBox: "scale-[1.4]",
                    },
                  }}
                />
              </>
            )}
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
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-fit px-5 py-3 rounded-2xl text-lr shadow-lg ${message.role === "user" ? "bg-gradient-to-r bg-cyan-0 hover:bg-cyan-400 text-white text-md font-large transitio ml-auto" : "bg-zinc-900/80 text-zinc-100"}`}
                >
                  {/* Copy Button */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap tracking-wide leading-4.5 prose-p:!my-2 prose-li:!my-0 prose-ul:!my-0 prose-headings:!my-0">
                      <>
                        <ReactMarkdown
                          rehypePlugins={[rehypeHighlight]}
                          skipHtml
                        >
                          {decode(
                            message.content
                              ?.replace(/<think>[\s\S]*?<\/think>/g, "")
                              ?.trim(),
                          )}
                        </ReactMarkdown>

                        {loading &&
                          index === messages.length - 1 &&
                          message.role === "assistant" && (
                            <span className="animate-pulse text-cyan-400">
                              ▋
                            </span>
                          )}
                      </>
                    </div>
                    <button
                      onClick={() => copyToClipboard(message.content, index)}
                      className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition text-zinc-400 hover:text-white"
                    >
                      {copiedIndex === index ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  {/* Model Badge */}
                  {message.role === "assistant" && message.model && (
                    <div className="inline-flex w-fit text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full mb-3 font-medium">
                      ```tsx
                      {message.model === "llama-3.3-70b-versatile"
                        ? "Llama 3.3"
                        : message.model === "llama-3.1-8b-instant"
                          ? "Llama 3.1"
                          : message.model === "deepseek-r1-distill-llama-70b"
                            ? "DeepSeek R1"
                            : message.model === "qwen/qwen3-32b"
                              ? "Qwen 3"
                              : message.model}
                      ```
                    </div>
                  )}
                  {/* Markdown Content */}
                  {/* Metadata */}
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
        <div className="max-w-4xl mx-auto w-full">{/* Model Selector */}</div>
        {/* INPUT SECTION */}{" "}
        <div className="border-t border-white/10 p-4 md:p-6">
          {" "}
          <div className="max-w-4xl mx-auto">
            {" "}
            {/* Model Selector */}{" "}
            <div className="mb-4">
              {" "}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-md text-white"
              >
                {" "}
                <option value="llama-3.3-70b-versatile">
                  {" "}
                  Llama 3.3 70B{" "}
                </option>{" "}
                <option value="llama-3.1-8b-instant">
                  {" "}
                  Llama 3.1 8B{" "}
                </option>{" "}
                <option value="qwen/qwen3-32b"> Qwen 3 32B </option>{" "}
              </select>
              <button
                onClick={exportChat}
                className="px-4 py-2 rounded-xl bg-cyan-0 hover:bg-cyan-400 text-white text-sm font-medium transition"
              >
                Export Chat
              </button>
            </div>{" "}
            <div className="flex-1 overflow-y-auto">Chat Messages</div>
            <UploadDocument />
            {/* Input Row */}{" "}
            <div className="flex items-center gap-3">
              {" "}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none"
              />{" "}
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-gradient-to-r  bg-cyan-0 hover:bg-cyan-400 text-white text-sm font-medium transition px-6 py-4 rounded-2xl text-white font-semibold hover:opacity-90 transition"
              >
                {" "}
                <Send size={18} />{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>
    </main>
  );
}
