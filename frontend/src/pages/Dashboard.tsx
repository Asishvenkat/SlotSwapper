import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { Event, EventStatus } from '../types';

const Dashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await api.getMyEvents();
      setEvents(response.events);
    } catch (error: any) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Listen for swap notifications
    const handleSwapUpdate = () => {
      fetchEvents();
    };

    window.addEventListener('swap-request-accepted', handleSwapUpdate);
    window.addEventListener('swap-request-rejected', handleSwapUpdate);

    return () => {
      window.removeEventListener('swap-request-accepted', handleSwapUpdate);
      window.removeEventListener('swap-request-rejected', handleSwapUpdate);
    };
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEvent({
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });
      toast.success('Event created successfully!');
      setShowModal(false);
      setTitle('');
      setStartTime('');
      setEndTime('');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create event');
    }
  };

  const handleUpdateStatus = async (eventId: string, status: EventStatus) => {
    try {
      await api.updateEvent(eventId, { status });
      toast.success('Event status updated!');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await api.deleteEvent(eventId);
      toast.success('Event deleted!');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete event');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Events</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No events yet. Create your first event!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div key={event._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {format(new Date(event.startTime), 'PPp')} - {format(new Date(event.endTime), 'p')}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      event.status === 'BUSY'
                        ? 'bg-gray-200 text-gray-800'
                        : event.status === 'SWAPPABLE'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {event.status === 'BUSY' && (
                    <button
                      onClick={() => handleUpdateStatus(event._id, 'SWAPPABLE' as EventStatus)}
                      className="btn btn-success text-sm"
                    >
                      Make Swappable
                    </button>
                  )}
                  {event.status === 'SWAPPABLE' && (
                    <button
                      onClick={() => handleUpdateStatus(event._id, 'BUSY' as EventStatus)}
                      className="btn btn-secondary text-sm"
                    >
                      Mark as Busy
                    </button>
                  )}
                  {event.status !== 'SWAP_PENDING' && (
                    <button onClick={() => handleDeleteEvent(event._id)} className="btn btn-danger text-sm">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
