import { http } from "../../services/http";
import type { Product } from "./types";

export const productApi = {
  getProducts: () => http<Product[]>("/products"),
};
