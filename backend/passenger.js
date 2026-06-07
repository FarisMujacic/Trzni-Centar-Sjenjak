const createApp = require("./server");

const PORT = process.env.PORT || 5000;

createApp().listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});