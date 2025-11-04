import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { SwapRequest, Event, User } from '../types';

const Requests = () => {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const [incoming, outgoing] = await Promise.all([
        api.getIncomingRequests(),
        api.getOutgoingRequests(),
      ]);
      
      setIncomingRequests(incoming.requests);
      setOutgoingRequests(outgoing.requests);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const handleUpdate = () => {
      fetchRequests();
    };

    window.addEventListener('swap-request-received', handleUpdate);
    window.addEventListener('swap-request-accepted', handleUpdate);
    window.addEventListener('swap-request-rejected', handleUpdate);

    return () => {
      window.removeEventListener('swap-request-received', handleUpdate);
      window.removeEventListener('swap-request-accepted', handleUpdate);
      window.removeEventListener('swap-request-rejected', handleUpdate);
    };
  }, []);

  const handleRespond = async (requestId: string, accepted: boolean) => {
    try {
      await api.respondToSwapRequest(requestId, { accepted });
      toast.success(accepted ? 'Swap accepted!' : 'Swap rejected!');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to respond to request');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Swap Requests</h1>

      {/* Incoming Requests */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Incoming Requests</h2>
        {incomingRequests.length === 0 ? (
          <p className="text-gray-500">No incoming requests</p>
        ) : (
          <div className="grid gap-4">
            {incomingRequests.map((request) => {
              const requester = request.requesterId as User;
              const requesterSlot = request.requesterSlotId as Event;
              const targetSlot = request.targetSlotId as Event;
              
              return (
                <div key={request._id} className="card">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>{requester.name}</strong> wants to swap:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p className="font-semibold text-sm mb-1">They offer:</p>
                        <p className="font-medium">{requesterSlot.title}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(requesterSlot.startTime), 'PPp')}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <p className="font-semibold text-sm mb-1">For your:</p>
                        <p className="font-medium">{targetSlot.title}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(targetSlot.startTime), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Status: <span className={`font-medium ${
                        request.status === 'PENDING' ? 'text-yellow-600' :
                        request.status === 'ACCEPTED' ? 'text-green-600' :
                        'text-red-600'
                      }`}>{request.status}</span>
                    </p>
                  </div>
                  
                  {request.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(request._id, true)}
                        className="btn btn-success flex-1"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(request._id, false)}
                        className="btn btn-danger flex-1"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outgoing Requests */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Outgoing Requests</h2>
        {outgoingRequests.length === 0 ? (
          <p className="text-gray-500">No outgoing requests</p>
        ) : (
          <div className="grid gap-4">
            {outgoingRequests.map((request) => {
              const targetUser = request.targetUserId as User;
              const requesterSlot = request.requesterSlotId as Event;
              const targetSlot = request.targetSlotId as Event;
              
              return (
                <div key={request._id} className="card">
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Request to <strong>{targetUser.name}</strong>:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p className="font-semibold text-sm mb-1">You offer:</p>
                        <p className="font-medium">{requesterSlot.title}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(requesterSlot.startTime), 'PPp')}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <p className="font-semibold text-sm mb-1">For their:</p>
                        <p className="font-medium">{targetSlot.title}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(targetSlot.startTime), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Status: <span className={`font-medium ${
                        request.status === 'PENDING' ? 'text-yellow-600' :
                        request.status === 'ACCEPTED' ? 'text-green-600' :
                        'text-red-600'
                      }`}>{request.status}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
