export interface Product {
  id?: any;
  item: string;
  description: string;
  price: number;
}

export interface Supplier {
  id?: string;
  name: string;
  unit: string;
}

export interface CartItem extends Product {
  quantity: number;
  addedAt?: number;
}

export interface Transaction {
  id?: any;
  branchName: string;
  totalprice: number;
  isReturningCustomer: boolean;
  timestamp?: string;
  items: any[];
  payment_proof?: string;
  customerName?: string;
  createdBy?: number;
  updatedBy?: number;
  cashier?: string;
}

export interface DbConfig {
  url: string;
  key: string;
}

export enum AppTab {
  PRODUCTS = "PRODUCTS",
  CART = "CART",
  HISTORY = "HISTORY",
}

export type ViewState = "POS" | "SUPPLIER_MGMT" | "PRODUCT_MGMT" | "DB_CONFIG";
