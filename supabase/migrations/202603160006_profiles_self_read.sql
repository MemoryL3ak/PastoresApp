-- Allow users to read their own profile
create policy "profiles_self_read"
  on core.profiles for select
  using (id = auth.uid());
