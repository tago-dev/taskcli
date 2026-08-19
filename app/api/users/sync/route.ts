import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabaseClient";

export async function GET() {
  return handleSync();
}

export async function POST() {
  return handleSync();
}

async function handleSync() {
  try {
    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({
      limit: 100,
      orderBy: "-created_at",
    });

    const clerkUsers = clerkUsersResponse.data || [];

    const profiles = clerkUsers.map(u => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") ||
        u.username ||
        u.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "Usuário";

      const email = u.emailAddresses?.[0]?.emailAddress || "";
      const avatarUrl = u.imageUrl || null;
      const createdAt = u.createdAt ? Number(u.createdAt) : Date.now();
      const updatedAt = u.updatedAt ? Number(u.updatedAt) : Date.now();

      return {
        id: u.id,
        name,
        email,
        avatar_url: avatarUrl,
        created_at: createdAt,
        updated_at: updatedAt,
      };
    });

    if (isSupabaseConfigured && supabase && profiles.length > 0) {
      await supabase.from("profiles").upsert(profiles, { onConflict: "id" });

      for (const profile of profiles) {
        if (profile.email) {
          await supabase
            .from("team_members")
            .update({
              user_id: profile.id,
              avatar_url: profile.avatar_url,
            })
            .ilike("email", profile.email)
            .is("user_id", null);
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: profiles.length,
      users: profiles.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatarUrl: p.avatar_url || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Falha ao sincronizar usuários do Clerk",
      },
      { status: 500 }
    );
  }
}
