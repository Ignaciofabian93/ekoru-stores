export default () => ({
  port: parseInt(process.env.PORT || '4002', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
});
