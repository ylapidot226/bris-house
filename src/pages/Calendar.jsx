import { useState, useEffect } from 'react';
import { subscribeToEvents, deleteEvent } from '../firebase';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format, isSameMonth,
  isSameDay, isToday
} from 'date-fns';
import { he } from 'date-fns/locale';
import { HDate, months, Locale } from '@hebcal/core';

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function getHebrewDay(date) {
  const hd = new HDate(date);
  return hd.renderGematriya(true).replace(/׳/g, '').split(' ')[0];
}

function getHebrewMonthYear(date) {
  const hd = new HDate(date);
  const startHd = new HDate(startOfMonth(date));
  const endHd = new HDate(endOfMonth(date));
  const startMonth = startHd.renderGematriya(true).split(' ').slice(1).join(' ');
  const endMonth = endHd.renderGematriya(true).split(' ').slice(1).join(' ');
  if (startMonth === endMonth) return startMonth;
  return `${startMonth} - ${endMonth}`;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  useEffect(() => {
    const unsub = subscribeToEvents(setEvents);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr);
  };

  const handleDateClick = (date) => {
    const dayEvents = getEventsForDate(date);
    setSelectedDate(date);
    setSelectedEvents(dayEvents);
  };

  const handleDelete = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק ברית זו?')) {
      await deleteEvent(id);
      setSelectedEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const hebrewRange = getHebrewMonthYear(currentMonth);

  return (
    <div className="page-container">
      <div className="calendar-card">
        <h1 className="page-title">לוח שנה</h1>
        <p className="page-subtitle">צפה בכל הבריתות המתוכננות</p>

        <div className="calendar-header">
          <button className="cal-nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            &#8594;
          </button>
          <div className="month-title-wrapper">
            <h2 className="month-title">
              {format(currentMonth, 'MMMM yyyy', { locale: he })}
            </h2>
            <span className="month-hebrew">{hebrewRange}</span>
          </div>
          <button className="cal-nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            &#8592;
          </button>
        </div>

        <div className="calendar-grid">
          {WEEKDAYS.map(d => (
            <div key={d} className="weekday-header">{d}</div>
          ))}
          {days.map((d, i) => {
            const dayEvents = getEventsForDate(d);
            const isCurrentMonth = isSameMonth(d, currentMonth);
            const isSelected = selectedDate && isSameDay(d, selectedDate);
            const hebDay = getHebrewDay(d);
            return (
              <div
                key={i}
                className={[
                  'calendar-day',
                  !isCurrentMonth && 'other-month',
                  isToday(d) && 'today',
                  dayEvents.length > 0 && 'has-event',
                  isSelected && 'selected',
                ].filter(Boolean).join(' ')}
                onClick={() => handleDateClick(d)}
              >
                <span className="day-number">{format(d, 'd')}</span>
                <span className="heb-date">{hebDay}</span>
                {dayEvents.length > 0 && (
                  <div className="event-dots">
                    {dayEvents.map((_, idx) => (
                      <span key={idx} className="event-dot" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot legend-today" />
            <span>היום</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-booked" />
            <span>תפוס</span>
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="detail-card">
          <h3 className="detail-title">
            {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
            {' · '}
            {new HDate(selectedDate).renderGematriya(true)}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="no-events">אין בריתות מתוכננות ביום זה</p>
          ) : (
            <div className="detail-events">
              {selectedEvents.map(event => (
                <div key={event.id} className="detail-event-item">
                  <div className="detail-event-info">
                    <h4>{event.familyName}</h4>
                    <p dir="ltr" className="detail-phone">{event.phone}</p>
                    <p className="detail-guests">{event.guests} אורחים</p>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(event.id)}
                    title="מחק"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
