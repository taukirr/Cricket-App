const app = require("./app");
const { port } = require("./config");

app.listen(port, () => {
  console.log(`Cricket backend listening on http://localhost:${port}`);
});
