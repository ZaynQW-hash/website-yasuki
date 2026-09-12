import type { SessionPayload } from "../lib/auth";

declare global {
  namespace App {
    interface Locals {
      admin?: SessionPayload;
    }
  }
}

export {};
