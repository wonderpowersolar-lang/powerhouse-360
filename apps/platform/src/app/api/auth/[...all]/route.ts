import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@ph360/auth";

export const runtime = "nodejs";
export const { GET, POST } = toNextJsHandler(auth);
