import { NextResponse } from "next/server";
import {
  supabaseAdmin,
  dbRowToPetListing,
  type DbListingRow,
} from "@/lib/supabase";
import {
  updateUserListing,
  deleteUserListing,
} from "@/lib/userListingsStore";

export const runtime = "nodejs";

/**
 * Extract and cryptographically verify the user from Bearer JWT header
 */
async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * GET /api/listings/user
 * Returns all listings belonging to the authenticated user.
 */
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const listings = (data as DbListingRow[]).map(dbRowToPetListing);
    return NextResponse.json({ ok: true, listings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/listings/user
 * Safely update listing status or info only if it belongs to the authenticated user.
 */
export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const { id, status, description, contactPhone, contactName, contactSocial, refreshDate } =
      body || {};

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "განცხადების ID სავალდებულოა" },
        { status: 400 },
      );
    }

    // 1. Fetch listing to confirm ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("listings")
      .select("id, user_id, status, description")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "განცხადება ვერ მოიძებნა" },
        { status: 404 },
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ განცხადების შეცვლის უფლება" },
        { status: 403 },
      );
    }

    // 2. Validate allowed status transitions
    const validStatuses = ["active", "resolved", "adopted", "archived"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "არასწორი სტატუსი" },
        { status: 400 },
      );
    }

    // 3. Build update payload
    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (description !== undefined) updates.description = description;
    if (contactPhone !== undefined) updates.contact_phone = contactPhone;
    if (contactName !== undefined) updates.contact_name = contactName;
    if (contactSocial !== undefined) updates.contact_social = contactSocial;
    if (refreshDate) {
      updates.created_at = new Date().toISOString();
      updates.status = "active";
    }
    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("listings")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 4. Keep cache / local sync in step
    await updateUserListing(id, {
      status: (status as string) || existing.status,
      description: (description as string) || existing.description,
    });

    return NextResponse.json({
      ok: true,
      message: "განცხადების სტატუსი წარმატებით განახლდა",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/listings/user
 * Safely delete listing only if it belongs to the authenticated user.
 */
export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const { id } = body || {};

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "განცხადების ID სავალდებულოა" },
        { status: 400 },
      );
    }

    // 1. Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("listings")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "განცხადება ვერ მოიძებნა" },
        { status: 404 },
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "თქვენ არ გაქვთ ამ განცხადების წაშლის უფლება" },
        { status: 403 },
      );
    }

    // 2. Delete from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from("listings")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 3. Sync memory / file cache
    await deleteUserListing(id);

    return NextResponse.json({
      ok: true,
      message: "განცხადება წარმატებით წაიშალა",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
