exports.sendWhatsAppMessage = (phone, message) => {
  console.log(`[WhatsApp Mock] Sending to ${phone}: ${message}`);
  // In a real scenario, you would use an API like Twilio or a local WhatsApp gateway
  return true;
};
