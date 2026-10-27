import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { ValidationPipe } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ConfigEnvType, envConfig } from "@module/_core/infras/env/configEnv";
import { AppModule } from "./root/app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get<ConfigType<ConfigEnvType>>(envConfig.KEY);

    const generator = app.get(MikroORM<PostgreSqlDriver>).getSchemaGenerator();
    await generator.ensureDatabase();
    if (configService.postgresDb.autoGenerate) {
        await generator.updateSchema({ wrap: false, safe: true });
    }

    app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));
    await app.listen(+configService.port);
}
bootstrap();
