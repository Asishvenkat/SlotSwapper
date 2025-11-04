import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { Event, User } from '../types';

const Marketplace = () => {
  const [swappableSlots, setSwappableSlots] = useState<Event[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      const [marketplace, myEvents] = await Promise.all([
        api.getSwappableSlots(),
        api.getMyEvents(),
      ]);
      
      setSwappableSlots(marketplace.slots);
      setMySwappableSlots(myEvents.events.filter((e) => e.status === 'SWAPPABLE'));
    } catch (error) {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSwap = (slot: Event) => {
    if (mySwappableSlots.length === 0) {
      toast.error('You need at least one swappable slot to make a request');
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleSubmitSwap = async (mySlotId: string) => {
    if (!selectedSlot) return;

    try {
      await api.createSwapRequest({
        mySlotId,
        theirSlotId: selectedSlot._id,
      });
      toast.success('Swap request sent!');
      setShowModal(false);
      setSelectedSlot(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create swap request');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Marketplace</h1>

      {swappableSlots.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No swappable slots available at the moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {swappableSlots.map((slot) => {
            const owner = slot.userId as User;
            return (
              <div key={slot._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{slot.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {format(new Date(slot.startTime), 'PPp')} - {format(new Date(slot.endTime), 'p')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Owner: {owner.name}
                    </p>
                  </div>
                  <button onClick={() => handleRequestSwap(slot)} className="btn btn-primary">
                    Request Swap
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Swap Request Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Select Your Slot to Offer</h2>
            <p className="mb-4 text-gray-600">
              You want: <strong>{selectedSlot.title}</strong> ({format(new Date(selectedSlot.startTime), 'PPp')})
            </p>
            
            {mySwappableSlots.length === 0 ? (
              <p className="text-red-600">You don't have any swappable slots</p>
            ) : (
              <div className="space-y-2 mb-4">
                {mySwappableSlots.map((slot) => (
                  <div
                    key={slot._id}
                    onClick={() => handleSubmitSwap(slot._id)}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-primary-50 cursor-pointer"
                  >
                    <h4 className="font-semibold">{slot.title}</h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(slot.startTime), 'PPp')} - {format(new Date(slot.endTime), 'p')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={() => setShowModal(false)} className="btn btn-secondary w-full">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
