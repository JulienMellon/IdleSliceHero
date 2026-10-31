/** Pin the time zone for every run, so `npx jest <file>` sees the same local dates as `npm test` (dates in the rewards tests are New York's). */
module.exports = async () => {
  process.env.TZ = 'America/New_York';
};
