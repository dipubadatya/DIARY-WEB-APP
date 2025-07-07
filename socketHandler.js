const User = require('./models/users');
const Message = require('./models/message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('authenticate', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);

      User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      }).then(() => {
        io.emit('userStatus', {
          userId,
          isOnline: true,
          lastSeen: new Date()
        });
      });
    });

    socket.on('sendMessage', async ({ sender, receiver, message }) => {
      try {
        const newMessage = new Message({
          sender,
          receiver,
          message,
          status: 'sent'
        });

        const savedMessage = await newMessage.save();

        await Message.updateOne(
          { _id: savedMessage._id },
          { $set: { status: 'delivered' } }
        );

        io.to(sender).to(receiver).emit('newMessage', {
          ...savedMessage.toObject(),
          status: 'delivered'
        });

      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('typing', ({ sender, receiver, username }) => {
      socket.to(receiver).emit('typing', { sender, username });
    });

    socket.on('stopTyping', ({ sender, receiver }) => {
      socket.to(receiver).emit('stopTyping', { sender });
    });

    socket.on('markAsSeen', async ({ sender, receiver }) => {
      try {
        await Message.updateMany(
          { sender, receiver, status: 'delivered' },
          { $set: { status: 'seen', seenAt: new Date() } }
        );

        io.to(sender).emit('messagesSeen', { receiver });
        io.to(receiver).emit('messagesSeen', { sender: receiver });

      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      const rooms = Array.from(socket.rooms);
      if (rooms.length > 1) {
        const userId = rooms[1];

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        io.emit('userStatus', {
          userId,
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });
  });
};
