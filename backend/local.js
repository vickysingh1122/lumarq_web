import app from './app.js';

app.listen(process.env.PORT || 3000, () => {
  console.log('Consultation API listening on port %s', process.env.PORT || 3000);
});
