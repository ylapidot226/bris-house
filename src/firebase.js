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
    toDate: row.to_date || '',
    multiDay: !!row.multi_day,
    familyName: row.family_name,
    phone: row.phone,
    guests: row.guests,
    createdAt: row.created_at,
  };
}

export async function addEvent(event) {
  const row = {
    date: event.date,
    family_name: event.familyName,
    phone: event.phone || null,
    guests: event.guests,
  };
  if (event.multiDay) {
    row.multi_day = true;
    row.to_date = event.toDate || null;
  }
  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select()
    .single();

  if (error) { console.error('addEvent error:', JSON.stringify(error), 'row:', JSON.stringify(row)); throw error; }
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
  if (updates.toDate !== undefined) dbUpdates.to_date = updates.toDate || null;
  if (updates.multiDay !== undefined) dbUpdates.multi_day = updates.multiDay;
  if (updates.familyName !== undefined) dbUpdates.family_name = updates.familyName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.guests !== undefined) dbUpdates.guests = updates.guests;

  const { error } = await supabase
    .from('events')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
}
