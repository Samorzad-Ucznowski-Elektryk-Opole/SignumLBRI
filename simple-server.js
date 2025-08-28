import app from './app';

const PORT = parseInt(process.env.PORT || '4000');

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
