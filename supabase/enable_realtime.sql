do $$
begin
  begin
    alter publication supabase_realtime add table public.tasks;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table public.teams;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_members;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table public.notes;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table public.profiles;
  exception when others then null;
  end;
end $$;
