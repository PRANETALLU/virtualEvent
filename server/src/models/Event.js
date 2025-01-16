const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tickets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
    }],
  });
  
  module.exports = mongoose.model('Event', EventSchema);