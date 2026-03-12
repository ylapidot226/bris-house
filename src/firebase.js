import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnicpbfqytklydktqngw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaWNwYmZxeXRrbHlka3Rxbmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY4NjEsImV4cCI6MjA4ODkwMjg2MX0.KnLtsD4sQ5qrScM00-mURdZ08f3d23JLd0_P9OylJFs';

const supabase = createClient(supabaseUrl, supabaseKey);

export function subscribeToEvents(callback) {
  // Initial fetch
  supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .then(({ data }) => {
      if (data) callback(data.map(mapRow));
    });

  // Realtime subscription
  const channel = supabase
    .channel('events-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
      // Re-fetch all on any change for simplicity
      supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .then(({ data }) => {
          if (data) callback(data.map(mapRow));
        });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

function mapRow(row) {
  return {
    id: row.id,
    date: row.date,
    familyName: row.family_name,
    phone: row.phone,
    guests: row.guests,
    createdAt: row.created_at,
  };
}

export async function addEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      date: event.date,
      family_name: event.familyName,
      phone: event.phone,
      guests: event.guests,
    })
    .select()
    .single();

  if (error) throw error;
  return { key: data.id };
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateEvent(id, updates) {
  const dbUpdates = {};
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.familyName !== undefined) dbUpdates.family_name = updates.familyName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.guests !== undefined) dbUpdates.guests = updates.guests;

  const { error } = await supabase
    .from('events')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
}
