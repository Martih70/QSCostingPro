// User Types
export type UserRole = 'admin' | 'estimator' | 'viewer';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_witness: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_witness: boolean;
  is_active: boolean;
  created_at: string;
}

// JWT Token Types
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  is_witness: boolean;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Auth Request/Response Types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

// Client Types
export interface Client {
  id: number;
  user_id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  website?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  website?: string;
  notes?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  is_active?: boolean;
}

// Building Contractor Types
export interface BuildingContractor {
  id: number;
  user_id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  website?: string;
  specialization?: string;
  is_active: boolean;
  rating: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContractorRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  website?: string;
  specialization?: string;
  notes?: string;
}

export interface UpdateContractorRequest extends Partial<CreateContractorRequest> {
  is_active?: boolean;
  rating?: number;
}

// Request with user context
export interface AuthenticatedRequest {
  user?: JWTPayload;
}

// Estimate Template Types
export interface EstimateTemplate {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  template_type: 'quick' | 'standard' | 'complex';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateLineItem {
  id: number;
  template_id: number;
  sequence_order: number;
  cost_item_id?: number;
  custom_description?: string;
  custom_unit_rate?: number;
  custom_unit?: string;
  category_id?: number;
  quantity?: number;
  unit_cost_override?: number;
  notes?: string;
  created_at: string;
}

export interface EstimateTemplateWithItems extends EstimateTemplate {
  line_items: TemplateLineItem[];
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  template_type?: 'quick' | 'standard' | 'complex';
  is_public?: boolean;
  line_items: Array<{
    cost_item_id?: number;
    custom_description?: string;
    custom_unit_rate?: number;
    custom_unit?: string;
    category_id?: number;
    quantity?: number;
    unit_cost_override?: number;
    notes?: string;
  }>;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}
