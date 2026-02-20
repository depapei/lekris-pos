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
}

export interface Transaction {
  id?: string;
  branchName: string;
  branchname?: string; // API lowercase version
  timestamp?: string;
  totalPrice: number;
  totalprice?: number; // API lowercase version
  items: any[]; // Flexible for both CartItem[] and {product_id, quantity}[]
  detail_transaction?: any; // API alternative items field
  isReturningCustomer?: boolean;
  isreturningcustomer?: boolean; // API lowercase version
  Isreturningcustomer?: boolean; // API specific casing for POST
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
