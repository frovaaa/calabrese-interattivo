alter table public.boards
  drop column if exists planning_type;

alter table public.participants
  drop column if exists preferred_destinations,
  drop column if exists max_budget,
  drop column if exists preferred_duration,
  drop column if exists transport_preferences,
  drop column if exists accommodation_preferences,
  drop column if exists constraints,
  drop column if exists general_notes;
