import { run } from "./orm";
import { User } from "./entities/User";

run(async (em) => {
  const u = await em.findOneOrFail(User, 1, { populate: ["posts"] });

  console.log("===== JSON.stringify(user) CO populate posts =====");
  console.log(JSON.stringify(u));
});
