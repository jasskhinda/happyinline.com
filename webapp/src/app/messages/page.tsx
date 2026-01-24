'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus, SubscriptionStatus } from '@/lib/auth';
import { getMyShop, Shop } from '@/lib/shop';
import {
  getShopConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  Conversation,
  Message,
} from '@/lib/messaging';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  MessageSquare,
  Send,
  User,
  ArrowLeft,
  Search,
  ChevronRight,
} from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start polling when a conversation is selected
    if (selectedConversation && currentUserId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [selectedConversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      if (selectedConversation) {
        await loadMessages(selectedConversation.id, false);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const loadData = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      const subStatus = await getSubscriptionStatus(user.id);
      setSubscription(subStatus);

      if (!subStatus?.isActive) {
        router.push('/subscribe');
        return;
      }

      const shopResult = await getMyShop(user.id);
      if (!shopResult.success || !shopResult.shop) {
        router.push('/shop/create');
        return;
      }

      setShop(shopResult.shop);

      // Load conversations
      await loadConversations(shopResult.shop.id, user.id);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (shopId: string, userId: string) => {
    const result = await getShopConversations(shopId, userId);
    if (result.success && result.conversations) {
      setConversations(result.conversations);
    }
  };

  const loadMessages = async (conversationId: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    const result = await getConversationMessages(conversationId);
    if (result.success && result.messages) {
      setMessages(result.messages);
    }
    if (showLoading) setLoading(false);
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await loadMessages(conv.id);

    // Mark as read
    if (currentUserId) {
      await markConversationAsRead(conv.id, currentUserId);
      // Update local state to clear unread count
      setConversations(prev =>
        prev.map(c =>
          c.id === conv.id
            ? {
                ...c,
                user1_unread_count: c.user1_id === currentUserId ? 0 : c.user1_unread_count,
                user2_unread_count: c.user2_id === currentUserId ? 0 : c.user2_unread_count,
              }
            : c
        )
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const result = await sendMessage(selectedConversation.id, currentUserId, messageText);

    if (result.success && result.message) {
      setMessages(prev => [...prev, result.message!]);
      // Update conversation's last message in list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, last_message: result.message, updated_at: new Date().toISOString() }
            : c
        )
      );
    }

    setSending(false);
  };

  const getOtherUser = (conv: Conversation) => {
    if (!currentUserId) return conv.user1;
    return conv.user1_id === currentUserId ? conv.user2 : conv.user1;
  };

  const getUnreadCount = (conv: Conversation) => {
    if (!currentUserId) return 0;
    return conv.user1_id === currentUserId
      ? conv.user1_unread_count
      : conv.user2_unread_count;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const otherUser = getOtherUser(conv);
    return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8 pt-28 flex-1">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-[#0393d5]">
            Communicate with your customers
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden h-[calc(100vh-280px)] min-h-[500px] flex">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-white/10`}>
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#0393d5]"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-500 mb-4" />
                  <p className="text-gray-400 text-lg font-medium">No conversations yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Messages from customers will appear here
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherUser = getOtherUser(conv);
                  const unreadCount = getUnreadCount(conv);
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all border-b border-white/5 ${
                        isSelected ? 'bg-white/10' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {otherUser?.profile_image ? (
                          <img
                            src={otherUser.profile_image}
                            alt={otherUser.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#0393d5]/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-[#0393d5]" />
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0393d5] rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium truncate ${unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                            {otherUser?.name || 'Unknown User'}
                          </p>
                          {conv.last_message && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className={`text-sm truncate mt-1 ${unreadCount > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                            {conv.last_message.sender_id === currentUserId ? 'You: ' : ''}
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-white/10 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>

                  {getOtherUser(selectedConversation)?.profile_image ? (
                    <img
                      src={getOtherUser(selectedConversation)?.profile_image!}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0393d5]/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#0393d5]" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-white">
                      {getOtherUser(selectedConversation)?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {getOtherUser(selectedConversation)?.email}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isMe
                              ? 'bg-[#0393d5] text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMe ? 'text-white/70' : 'text-gray-400'
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-[#0393d5]"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className={`p-3 rounded-full transition-all ${
                        newMessage.trim() && !sending
                          ? 'bg-[#0393d5] hover:bg-[#027bb5] text-white'
                          : 'bg-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="w-20 h-20 text-gray-500 mb-4" />
                <p className="text-gray-400 text-xl font-medium">Select a conversation</p>
                <p className="text-gray-500 text-sm mt-2">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
