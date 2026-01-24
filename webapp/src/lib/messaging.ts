/**
 * Messaging Library for Web App
 * Handles conversations and messages between customers and shop staff
 */

import { getSupabaseClient } from './supabase';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    profile_image: string | null;
  };
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  shop_id: string | null;
  user1_unread_count: number;
  user2_unread_count: number;
  created_at: string;
  updated_at: string;
  user1?: {
    id: string;
    name: string;
    email: string;
    profile_image: string | null;
  };
  user2?: {
    id: string;
    name: string;
    email: string;
    profile_image: string | null;
  };
  shop?: {
    id: string;
    name: string;
  };
  last_message?: Message;
}

/**
 * Get all conversations for a shop (for owner/provider view)
 */
export const getShopConversations = async (shopId: string, currentUserId: string) => {
  try {
    const supabase = getSupabaseClient();

    // Get conversations where either user is staff of this shop
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, name, email, profile_image),
        user2:profiles!conversations_user2_id_fkey(id, name, email, profile_image),
        shop:shops(id, name)
      `)
      .eq('shop_id', shopId)
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching shop conversations:', error);
      return { success: false, error: error.message };
    }

    // For each conversation, get the last message
    const conversationsWithLastMessage = await Promise.all(
      (conversations || []).map(async (conv: Conversation) => {
        const { data: messages } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, name, email, profile_image)
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          ...conv,
          last_message: messages?.[0] || null,
        };
      })
    );

    return { success: true, conversations: conversationsWithLastMessage };
  } catch (err) {
    console.error('Unexpected error in getShopConversations:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get all conversations for a user (for customer view or general use)
 */
export const getUserConversations = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, name, email, profile_image),
        user2:profiles!conversations_user2_id_fkey(id, name, email, profile_image),
        shop:shops(id, name)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user conversations:', error);
      return { success: false, error: error.message };
    }

    // For each conversation, get the last message
    const conversationsWithLastMessage = await Promise.all(
      (conversations || []).map(async (conv: Conversation) => {
        const { data: messages } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, name, email, profile_image)
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          ...conv,
          last_message: messages?.[0] || null,
        };
      })
    );

    return { success: true, conversations: conversationsWithLastMessage };
  } catch (err) {
    console.error('Unexpected error in getUserConversations:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get messages in a conversation
 */
export const getConversationMessages = async (conversationId: string) => {
  try {
    const supabase = getSupabaseClient();

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, profile_image)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messages: messages || [] };
  } catch (err) {
    console.error('Unexpected error in getConversationMessages:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
) => {
  try {
    const supabase = getSupabaseClient();

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, profile_image)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { success: true, message };
  } catch (err) {
    console.error('Unexpected error in sendMessage:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Mark conversation as read for a user
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
) => {
  try {
    const supabase = getSupabaseClient();

    // Get conversation to determine which unread count to update
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (fetchError || !conversation) {
      return { success: false, error: 'Conversation not found' };
    }

    // Update the correct unread count field
    const updateField =
      conversation.user1_id === userId
        ? { user1_unread_count: 0 }
        : { user2_unread_count: 0 };

    const { error } = await supabase
      .from('conversations')
      .update(updateField)
      .eq('id', conversationId);

    if (error) {
      console.error('Error marking conversation as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in markConversationAsRead:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string,
  shopId: string | null = null
) => {
  try {
    const supabase = getSupabaseClient();

    // Call Supabase function to get or create conversation
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user1_id: userId1,
      p_user2_id: userId2,
      p_shop_id: shopId,
    });

    if (error) {
      console.error('Error getting/creating conversation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, conversationId: data };
  } catch (err) {
    console.error('Unexpected error in getOrCreateConversation:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get conversation details
 */
export const getConversationDetails = async (conversationId: string) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, name, email, profile_image),
        user2:profiles!conversations_user2_id_fkey(id, name, email, profile_image),
        shop:shops(id, name)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, conversation: data };
  } catch (err) {
    console.error('Unexpected error in getConversationDetails:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get unread message count for a user across all conversations
 */
export const getUnreadCount = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('user1_id, user2_id, user1_unread_count, user2_unread_count')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: error.message, count: 0 };
    }

    let totalUnread = 0;
    (conversations || []).forEach((conv) => {
      if (conv.user1_id === userId) {
        totalUnread += conv.user1_unread_count || 0;
      } else {
        totalUnread += conv.user2_unread_count || 0;
      }
    });

    return { success: true, count: totalUnread };
  } catch (err) {
    console.error('Unexpected error in getUnreadCount:', err);
    return { success: false, error: 'An unexpected error occurred', count: 0 };
  }
};

/**
 * Poll for new messages (used instead of real-time due to Supabase limitations)
 */
export const pollForNewMessages = async (
  conversationId: string,
  lastMessageId: string | null
) => {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, profile_image)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (lastMessageId) {
      query = query.gt('id', lastMessageId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error polling messages:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messages: messages || [] };
  } catch (err) {
    console.error('Unexpected error in pollForNewMessages:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
