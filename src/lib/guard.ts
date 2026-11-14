import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifyToken } from "./auth";

export async function requirePage() {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!verifyToken(c)) redirect("/login");
}
