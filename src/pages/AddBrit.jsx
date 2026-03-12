import { useState, useEffect } from 'react';
import { addEvent, subscribeToEvents, deleteEvent } from '../firebase';
import { format } from 'date-fns';

export default function AddBrit() {
  const [formData, setFormData] = useState({
    date: '',
    familyName: '',
    phone: '',
    guests: '',
    toDate: '',
  });
  const [multiDay, setMultiDay] = useState(false);
  const [events, setEvents] = useState([]);
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToEvents(setEvents);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  useEffect(() => {
    if (formData.date) {
      const existing = events.filter(e => e.date === formData.date);
      if (existing.length > 0) {
        const names = existing.map(e => e.familyName).join(', ');
        setWarning(`שים לב! כבר קיימת הזמנה בתאריך הזה עבור: ${names}`);
      } else {
        setWarning('');
      }
    } else {
      setWarning('');
    }
  }, [formData.date, events]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
      await deleteEvent(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.familyName) {
      return;
    }
    if (warning) {
      const confirmed = window.confirm(
        `${warning}\nהאם אתה בטוח שברצונך להוסיף הזמנה נוספת בתאריך הזה?`
      );
      if (!confirmed) return;
    }
    setLoading(true);
    try {
      await addEvent({
        date: formData.date,
        familyName: formData.familyName,
        phone: formData.phone,
        guests: formData.guests ? parseInt(formData.guests, 10) : 0,
        multiDay: multiDay,
        toDate: formData.toDate || '',
        createdAt: new Date().toISOString(),
      });
      setSuccess('ההזמנה נוספה בהצלחה!');
      setFormData({ date: '', familyName: '', phone: '', guests: '', toDate: '' });
      setMultiDay(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setSuccess('');
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="form-card">
        <h1 className="page-title">הוספת הזמנה ללינה</h1>
        <p className="page-subtitle">מלא את הפרטים להזמנת לינה</p>

        {success && <div className="alert alert-success">{success}</div>}
        {warning && <div className="alert alert-warning">{warning}</div>}

        <form onSubmit={handleSubmit} className="brit-form">
          <div className="form-group">
            <label htmlFor="date">תאריך</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="familyName">שם משפחה</label>
            <input
              type="text"
              id="familyName"
              name="familyName"
              value={formData.familyName}
              onChange={handleChange}
              placeholder="הכנס שם משפחה"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">מספר טלפון</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="050-0000000"
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label htmlFor="guests">מספר אורחים</label>
            <input
              type="number"
              id="guests"
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              placeholder="0"
              min="1"
              dir="ltr"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={multiDay}
                onChange={(e) => {
                  setMultiDay(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, toDate: '' }));
                  }
                }}
              style={{ marginLeft: '8px' }}
              />
              ההזמנה היא לכמה ימים
            </label>
          </div>

          {multiDay && (
            <div className="form-group">
              <label htmlFor="toDate">עד תאריך</label>
              <input
                type="date"
                id="toDate"
                name="toDate"
                value={formData.toDate}
                onChange={handleChange}
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'שומר...' : 'הוסף הזמנה'}
          </button>
        </form>
      </div>

      {events.length > 0 && (
        <div className="form-card recent-events">
          <h2 className="section-title">הזמנות קרובות</h2>
          <div className="events-list">
            {events
              .filter(e => e.date >= new Date().toISOString().slice(0, 10))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-date">
                    {format(new Date(event.date + 'T00:00:00'), 'dd/MM/yyyy')}
                  </div>
                  <div className="event-details">
                    <span className="event-family">{event.familyName}</span>
                    <span className="event-guests">{event.guests} אורחים</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
