import { customAlphabet } from "nanoid";

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const nano = customAlphabet(alphabet, 6);

export function newReceiptId(): string {
  return `fa-${nano()}`;
}

export function isValidReceiptId(id: string): boolean {
  return /^fa-[a-z0-9]{4,12}$/.test(id);
}
