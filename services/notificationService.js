exports.sendWhatsApp = (job) => {
  console.log(`WhatsApp sent to ${job.mobile}`);
};

exports.sendNotification = (message) => {
  console.log("NOTIFICATION:", message);
};