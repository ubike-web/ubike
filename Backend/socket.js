const { Server } = require('socket.io');
const supabase = require('./config/supabase');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join', async ({ userId, userType }) => {
      console.log(`${userType} connected: ${userId}`);
      const table = userType === 'user' ? 'qr_users' : 'qr_captains';
      await supabase.from(table).update({ socket_id: socket.id }).eq('id', userId);
    });

    socket.on('update-location-captain', async ({ userId, location }) => {
      if (!location?.ltd || !location?.lng) {
        return socket.emit('error', { message: 'Invalid location data' });
      }
      await supabase.from('qr_captains').update({
        location_lat: location.ltd,
        location_lng: location.lng,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      // Broadcast live location to user with an active ride with this captain
      try {
        const { data: activeRide } = await supabase
          .from('qr_rides')
          .select('user_id, qr_users!qr_rides_user_id_fkey(socket_id)')
          .eq('captain_id', userId)
          .in('status', ['accepted', 'ongoing'])
          .maybeSingle();
        const userSocketId = activeRide?.qr_users?.socket_id;
        if (userSocketId && io) {
          io.to(userSocketId).emit('captain-location-update', { ltd: location.ltd, lng: location.lng });
        }
      } catch (_) {}
    });

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);
    });

    socket.on('message', async ({ rideId, msg, userType, time }) => {
      socket.to(rideId).emit('receiveMessage', { msg, by: userType, time });
      try {
        const { data: ride } = await supabase.from('qr_rides').select('messages').eq('id', rideId).single();
        if (ride) {
          const messages = Array.isArray(ride.messages) ? ride.messages : [];
          messages.push({ msg, by: userType, time, timestamp: new Date().toISOString() });
          await supabase.from('qr_rides').update({ messages }).eq('id', rideId);
        }
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  if (io) {
    console.log('message sent to:', socketId);
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log('Socket.io not initialized.');
  }
};

module.exports = { initializeSocket, sendMessageToSocketId };
