export interface User {
  id: number;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  encryptionKey: string | null;
  isLoading: boolean;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  children?: Folder[];
}

export interface Item {
  id: number;
  name: string;
  type: 'text' | 'secret' | 'api_key' | 'code' | 'file';
  encrypted_content: string | null;
  file_path?: string;
  file_size?: number;
  language?: string;
  tags: string[];
  folder_id: number;
  folder_name?: string;
  user_id: number;
  access_count: number;
  last_accessed: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemVersion {
  id: number;
  item_id: number;
  encrypted_content: string;
  version_number: number;
  created_at: string;
}

export interface CreateItemData {
  name: string;
  type: Item['type'];
  encryptedContent?: string;
  folderId: number;
  language?: string;
  tags?: string[];
}

export interface UpdateItemData {
  name?: string;
  encryptedContent?: string;
  folderId?: number;
  language?: string;
  tags?: string[];
}

export interface BackupData {
  version: string;
  encrypted: boolean;
  data: string;
}

export interface Theme {
  mode: 'light' | 'dark';
}