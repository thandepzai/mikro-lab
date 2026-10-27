import { MikroORM } from "@mikro-orm/core";
import { MikroOrmMiddleware, MikroOrmModule } from "@mikro-orm/nestjs";
import { FlushMode, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { ConfigEnvType, envConfig } from "@module/_core/infras/env/configEnv";
import { setGlobalORM } from "@module/_core/infras/orm/mikro/util";
import { LabModule } from "@module/lab/lab.module";
import { Comment } from "@module/lab/domain/model/comment";
import { Post } from "@module/lab/domain/model/post";
import { User } from "@module/lab/domain/model/user";

const entities = [User, Post, Comment];

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [envConfig]
        }),
        MikroOrmModule.forRootAsync({
            imports: [ConfigModule],
            driver: PostgreSqlDriver,
            inject: [envConfig.KEY],
            useFactory: async (configService: ConfigType<ConfigEnvType>) => {
                const { username, password, host, port, database } = configService.postgresDb;
                setGlobalORM(
                    await MikroORM.init({
                        driver: PostgreSqlDriver,
                        host,
                        port,
                        user: username,
                        password,
                        dbName: database,
                        entities
                    })
                );
                return {
                    driver: PostgreSqlDriver,
                    clientUrl: `postgres://${username}:${password}@${host}:${port}/${database}`,
                    autoLoadEntities: true,
                    debug: true,
                    registerRequestContext: true,
                    autoJoinOneToOneOwner: false,
                    persistOnCreate: false,
                    ignoreUndefinedInQuery: true,
                    flushMode: FlushMode.COMMIT
                };
            }
        }),
        LabModule
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(MikroOrmMiddleware).forRoutes("*");
    }
}
