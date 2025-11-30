

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  karma: number;
  createdAt: number;
  isBanned?: boolean;
  emailVerified: boolean; // New field
}

export interface Message {
  id: string;
  title?: string;
  content: string;
  media?: string[]; // Array of URLs for images/video
  timestamp: number;
  sequenceNumber: number;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  parentId?: string | null; 
  tags: string[];
  isAdmin?: boolean;
  votes?: Record<string, number>; 
  commentCount?: number; // Counter for comments
  shareCount?: number; // Counter for shares
  community?: string; 
}

export type Language = 'ru' | 'en';

export interface Translations {
  system_name: string;
  footer: string;
  search_label: string;
  search_placeholder: string;
  search_placeholder_short: string;
  search_clear: string;
  input_placeholder: string;
  title_placeholder: string;
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
  sort_best: string;
  sort_newest_short: string;
  sort_oldest_short: string;
  sort_best_short: string;
  popular_tags_label: string;
  preloader_title: string;
  preloader_subtitle: string;
  next_msg_label: string;
  admin_login_title: string;
  login_btn: string;
  logout_btn: string;
  block_btn: string;
  admin_badge: string;
  // Panel Control
  hide_panel_btn: string;
  expand_panel_btn: string;
  // Mobile Menu
  menu_btn: string;
  close_btn: string;
  mobile_footer_text_1: string;
  mobile_footer_text_2: string;
  // Auth
  login_google: string;
  guest_mode: string;
  // Auth Modal
  auth_title_login: string;
  auth_title_register: string;
  auth_google_btn: string;
  auth_apple_btn: string;
  auth_or_divider: string;
  auth_email_label: string;
  auth_password_label: string;
  auth_username_label: string;
  auth_forgot_pass: string;
  auth_has_account: string;
  auth_no_account: string;
  auth_submit_login: string;
  auth_submit_register: string;
  auth_disclaimer: string;
  auth_switch_login: string;
  auth_switch_register: string;
  // Auth Errors
  error_generic: string;
  error_invalid_email: string;
  error_user_disabled: string;
  error_user_not_found: string;
  error_wrong_password: string;
  error_email_already_in_use: string;
  error_weak_password: string;
  error_missing_fields: string;
  // Auth Success
  auth_reset_sent: string;
  auth_verification_sent: string;
  // Post Menu
  post_menu_hide: string;
  post_menu_save: string;
  post_menu_subscribe: string;
  post_menu_report: string;
  // Post Time
  time_sec_ago: string;
  time_min_ago: string;
  time_hour_ago: string;
  time_day_ago: string;
  time_days_ago: string;
  time_month_ago: string;
  time_year_ago: string;
  time_years_ago: string;
  // User Menu
  menu_profile: string;
  menu_settings: string;
  menu_theme_day: string;
  menu_theme_night: string;
  email_verification_alert: string;
  email_verification_action: string;
  // Actions
  action_create: string;
  // Create Post Modal
  create_post_title: string;
  drafts_btn: string;
  choose_community: string;
  tab_text: string;
  tab_media: string;
  tab_link: string;
  tab_poll: string;
  title_required_placeholder: string;
  text_area_optional: string;
  save_draft_btn: string;
  publish_post_btn: string;
  media_drag_drop: string;
  link_url_placeholder: string;
  // Editor
  editor_write: string;
  editor_preview: string;
}

export interface MessageInputProps {
  onSendMessage: (content: string, title: string, manualTags?: string[]) => Promise<void>;
  replyingTo: Message | null;
  onCancelReply: () => void;
  shouldFocusOnReply?: boolean;
  cooldownRemaining: number;
  t: Translations;
  user: UserProfile | null;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onReply: (message: Message) => void;
  onTagClick: (tag: string) => void;
  onFlashMessage: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onBlockUser: (senderId: string) => void;
  onVote: (messageId: string, voteType: 'up' | 'down') => void;
  highlightedMessageId: string | null;
  allMessagesRaw?: Message[]; 
  isAdmin: boolean;
  t: Translations;
  locale: string;
}

export interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onReply: (message: Message) => void;
  onTagClick: (tag: string) => void;
  onFlashMessage: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onBlockUser: (senderId: string) => void;
  onVote: (messageId: string, voteType: 'up' | 'down') => void;
  parentSequenceNumber?: number; 
  parentSenderId?: string; 
  allMessages?: Message[]; 
  isFlashHighlighted?: boolean;
  isAdmin: boolean;
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