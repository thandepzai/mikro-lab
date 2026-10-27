import { registerAs } from "@nestjs/config";

export const envConfig = registerAs("env", () => ({
    NODE_ENV: process.env.NODE_ENV ?? "local",
    port: process.env.PORT ?? "3100",
    postgresDb: {
        host: process.env.PG_HOST ?? "localhost",
        port: Number(process.env.PG_PORT ?? 5434),
        username: process.env.PG_USER ?? "lab",
        password: process.env.PG_PASSWORD ?? "lab",
        database: process.env.PG_DB ?? "mikro_lab",
        autoGenerate: process.env.AUTO_GENERATE === "true"
    }
}));

export type ConfigEnvType = typeof envConfig;
