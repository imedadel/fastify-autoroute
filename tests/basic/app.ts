import { FastifyPlugin } from "fastify";
import { join } from "path";
import fastifyAutoRoute from "./../../src";

const app: FastifyPlugin = function (fastify, opts, next): void {
	fastify.decorate("loadsFastify", true);
	fastify.register(fastifyAutoRoute, {
		autoRouteDir: join(__dirname, "routes"),
	});

	next();
};

export default app;
