import { Injectable } from "@nestjs/common";
import { runInTransaction } from "@module/_core/infras/orm/mikro/util";
import { UserRepository } from "../repository/user";

@Injectable()
export class Bai11Service {
    constructor(private readonly userRepository: UserRepository) {}

    async withoutTransaction() {
        await this.createUser("khong-bao");
        throw new Error("Loi o buoc 2");
    }

    async withTransaction() {
        await runInTransaction(async () => {
            await this.createUser("co-bao");
            throw new Error("Loi o buoc 2");
        });
    }

    async withTransactionSuccess() {
        await runInTransaction(async () => {
            await this.createUser("thanh-cong-1");
            await this.createUser("thanh-cong-2");
        });
        return this.listUsers();
    }

    async nestedTransaction() {
        await runInTransaction(async () => {
            await this.createUser("long-A");
            try {
                await runInTransaction(async () => {
                    await this.createUser("long-B");
                    throw new Error("Loi trong khoi long");
                });
            } catch {}
            await this.createUser("long-C");
        });
        return this.listUsers();
    }

    async listUsers() {
        const users = await this.userRepository.find({ name: { $like: "Bai11%" } });
        return users.map((user) => user.name);
    }

    private createUser(tag: string) {
        const suffix = Date.now();
        return this.userRepository.create({ name: `Bai11 ${tag} ${suffix}`, email: `bai11-${tag}-${suffix}@lab.dev` });
    }
}
