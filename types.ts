export interface Message {
  id: string;
  content: string;
  timestamp: number;
  sequenceNumber: number;
  senderId: string;
  parentId?: string | null; // Allow null for Firestore compatibility
  tags: string[];
}

export type Language = 'ru' | 'en';

export interface Translations {
  system_name: string;
  footer: string;
  search_label: string;
  search_placeholder: string;
  search_clear: string;
  input_placeholder: string;
  chars_label: string;
  new_entry_label: string;
  publish_btn: string;
  replying_to_prefix: string;
  cancel_btn: string;
  all_messages_tab: string;
  my_dialogs_tab: string;
  no_entries: string;
  no_dialogs: string;
  id_label: string;
  you_label: string;
  time_label: string;
  reply_btn: string;
  copy_btn: string;
  quick_entry_label: string;
  send_btn: string;
  theme_light: string;
  theme_dark: string;
  session_key_label: string;
  session_expl_text: string;
  add_tag_btn: string;
  tags_placeholder: string;
  sort_newest: string;
  sort_oldest: string;
  preloader_title: string;
  preloader_subtitle: string;
  next_msg_label: string;
}

export interface MessageInputProps {
  onSendMessage: (content: string, manualTags?: string[]) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  shouldFocusOnReply?: boolean;
  cooldownRemaining: number;
  t: Translations;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onReply: (message: Message) => void;
  onTagClick: (tag: string) => void;
  onFlashMessage: (id: string) => void;
  highlightedMessageId: string | null;
  allMessagesRaw?: Message[]; // Needed to lookup parent sequence numbers
  t: Translations;
  locale: string;
}

export interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onReply: (message: Message) => void;
  onTagClick: (tag: string) => void;
  onFlashMessage: (id: string) => void;
  parentSequenceNumber?: number; // Kept for fallback
  parentSenderId?: string; // For "Reply to #HASH"
  isFlashHighlighted?: boolean;
  t: Translations;
  locale: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  t: Translations;
}

export interface StickyInputProps extends MessageInputProps {
  isVisible: boolean;
}