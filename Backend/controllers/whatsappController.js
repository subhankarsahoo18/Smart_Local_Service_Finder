const twilio = require('twilio');
const Service = require('../models/Service');
const User = require('../models/User');

const { MessagingResponse } = twilio.twiml;

// @desc    Handle incoming WhatsApp messages from Twilio
// @route   POST /api/whatsapp/webhook
// @access  Public
const handleIncomingWhatsApp = async (req, res) => {
  const twiml = new MessagingResponse();
  
  // Twilio sends the message body in req.body.Body string
  const incomingMsg = req.body.Body ? req.body.Body.toLowerCase().trim() : '';
  const senderPhone = req.body.From;

  console.log(`Received WhatsApp message from ${senderPhone}: ${incomingMsg}`);

  // Basic NLP / command detection
  // We can look for keywords like "electrician", "plumber" etc.
  
  // Initial Greetings check
  if (['hello', 'hi', 'hey', 'help', 'start'].includes(incomingMsg)) {
    twiml.message(`*Welcome to Smart Local Service Finder!* 🛠️\n\nI can help you find trusted local professionals.\n\nReply with a service you need (e.g., "Electrician", "Plumber", "AC Repair") and optionally your location (e.g., "Plumber in Bhubaneswar").`);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    // 1. Identify the user by phone number
    // Strip "whatsapp:" prefix if present
    const cleanPhone = senderPhone.replace('whatsapp:', '');
    const user = await User.findOne({ mobileNumber: cleanPhone });

    // 2. Extract service type and location
    let keywordQuery = incomingMsg;
    let locationQuery = '';

    if (incomingMsg.includes(' in ')) {
      const parts = incomingMsg.split(' in ');
      keywordQuery = parts[0].trim();
      locationQuery = parts[1].trim();
    } else if (incomingMsg.includes(' near ')) {
      const parts = incomingMsg.split(' near ');
      keywordQuery = parts[0].trim();
      locationQuery = parts[1].trim();
    }

    // Build the query object
    let query = {};
    if (keywordQuery) {
      query.$or = [
        { serviceType: { $regex: keywordQuery, $options: 'i' } },
        { serviceName: { $regex: keywordQuery, $options: 'i' } },
      ];
    }
    if (locationQuery) {
      query.location = { $regex: locationQuery, $options: 'i' };
    }

    const services = await Service.find(query).limit(3);

    if (services.length > 0) {
      let replyText = `I found some ${keywordQuery} services for you:\n\n`;
      
      for (const [index, service] of services.entries()) {
        replyText += `*${index + 1}. ${service.serviceName}*\n`;
        replyText += `👨‍🔧 Provider: ${service.providerName}\n`;
        replyText += `📍 Location: ${service.location}\n`;
        replyText += `💰 Starting at: ₹${service.serviceCharges}\n`;
        replyText += `⭐ Rating: ${service.rating ? service.rating.toFixed(1) : 'New'}\n`;
        replyText += `📞 Contact: ${service.mobileNumber}\n\n`;

        // 3. Create a booking record if user is identified
        if (user) {
          try {
            const Booking = require('../models/Booking');
            await Booking.create({
              customer: user._id,
              provider: service.provider,
              service: service._id,
              interactionType: 'whatsapp',
              status: 'contacted'
            });
            console.log(`Booking created for ${user.name} with ${service.serviceName}`);
          } catch (err) {
            console.error('Error creating automated booking:', err);
          }
        }
      }
      
      replyText += `You can directly call or message the contact numbers provided above! Let me know if you need anything else.`;
      twiml.message(replyText);
    } else {
      twiml.message(`I couldn't find any services matching "${incomingMsg}". \n\nPlease try searching for something else, like "AC Repair" or "Plumber".`);
    }

  } catch (error) {
    console.error('WhatsApp Bot Error:', error);
    twiml.message("Oops! Something went wrong while searching for services. Please try again later.");
  }

  // Send the TwiML response back to Twilio
  res.type('text/xml');
  res.send(twiml.toString());
};

module.exports = {
  handleIncomingWhatsApp,
};
