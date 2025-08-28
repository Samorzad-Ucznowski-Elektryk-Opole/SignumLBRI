const app = require('./dist/app.js');
const PORT = 4000;
app.default.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
