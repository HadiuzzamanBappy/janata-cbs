"use server";

import { cookies } from "next/headers";

export async function clearInitLoginCookie() {
  const store = await cookies();
  store.delete("initLogin");
}
