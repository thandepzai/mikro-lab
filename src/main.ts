// BAI 20G — Tat Identity Map cho query chi doc
// DOAN TRUOC KHI CHAY: find User voi disableIdentityMap: true, doi name thanh "Sua", flush. Doc lai bang find khac: G) name trong DB la "An" hay "Sua"? ->
import "reflect-metadata";
import { MikroORM } from "@mikro-orm/sqlite";
import { ReflectMetadataProvider } from "@mikro-orm/decorators/legacy";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { Comment } from "./entities/Comment";

async function main() {
  const orm = await MikroORM.init({
    entities: [User, Post, Comment],
    dbName: ":memory:",
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();

  const emSeed = orm.em.fork();
  emSeed.create(User, { name: "An", email: "an@example.com" });
  await emSeed.flush();

  const em1 = orm.em.fork();
  const [a1] = await em1.find(User, {});
  const [b1] = await em1.find(User, {});
  console.log("E) binh thuong, a === b:", a1 === b1);

  const em2 = orm.em.fork();
  const [a2] = await em2.find(User, {}, { disableIdentityMap: true });
  const [b2] = await em2.find(User, {}, { disableIdentityMap: true });
  console.log("F) disableIdentityMap, a === b:", a2 === b2);

  const emSua = orm.em.fork();
  const [u] = await emSua.find(User, {}, { disableIdentityMap: true });
  u.name = "Sua";
  await emSua.flush();
  const [docLai] = await orm.em.fork().find(User, {});
  console.log("G) name trong DB:", docLai.name);

  await orm.close(true);
}

main();
