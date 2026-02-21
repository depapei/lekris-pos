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
  branchname?: string;
  totalPrice: number;
  totalprice?: number;
  Isreturningcustomer: boolean;
  isreturningcustomer?: boolean;
  timestamp?: string;
  items: any[];
  detail_transaction?: any;
  payment_proof?: string;
  customerName?: string;
  createdBy?: number;
  updatedBy?: number;
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
