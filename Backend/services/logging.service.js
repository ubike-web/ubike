// Simplified logging — writes to console only (no DB)
const dbStream = {
  write: (message) => {
    if (message.startsWith('OPTIONS')) return;
    console.log(message.replace('\n', ''));
  },
};

module.exports = dbStream;
