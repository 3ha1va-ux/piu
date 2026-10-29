import { NextResponse } from "next/server";
import { checkAdminCredentials, createSessionToken, setSessionCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body ?? {};

    if (!username || !password) {
      return NextResponse.json(
        { error: "გთხოვთ შეიყვანოთ მომხმარებელი და პაროლი" },
        { status: 400 }
      );
    }

    const isValid = checkAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "მომხმარებელი ან პაროლი არასწორია" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(username);
    const response = NextResponse.json({ ok: true, user: username });
    setSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { error: "სისტემური შეცდომა ავტორიზაციისას" },
      { status: 500 }
    );
  }
}
