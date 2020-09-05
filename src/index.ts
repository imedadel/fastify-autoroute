import fg from "fast-glob";
import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyPlugin } from "fastify";

export interface AutoRouteOptions {
	autoRouteDir: string;
}

const fastifyAutoRoute: FastifyPluginAsync<AutoRouteOptions> = async (
	fastify,
	options
) => {
	const methods = [
		"GET",
		"HEAD",
		"POST",
		"PUT",
		"DELETE",
		"OPTIONS",
		"PATCH",
		"ALL",
	];
	const joinedMethods = methods.join(",");
	const glob =
		options.autoRouteDir +
		`/**/*.{${joinedMethods},${joinedMethods.toLowerCase()}}.{js,ts,cjs,mjs}`;
	const files = await fg(glob, { unique: true });

	const parsedRoutes = files.map((file) => {
		const stripped = file
			.replace(options.autoRouteDir, "")
			.replace(/(\.ts|\.js|\.cjs|\.mjs)$/, "");
		const [, cleanRoute, method] = stripped.match(/(.+)\.(\w+)$/);
		const fastifyRoute = cleanRoute
			.replace(/\[\.{3}\w+\]/g, "*") // technically you can't have more than one per route
			.replace(/\[/g, ":")
			.replace(/\]/g, "")
			.replace(/(index)$/, "");

		return {
			method:
				method.toUpperCase() === "ALL"
					? methods.slice(0, 7)
					: method.toUpperCase(),
			route: fastifyRoute,
			file,
		};
	});

	for (const item of parsedRoutes) {
		const content = await import(item.file);
		let { default: handler, onRequest = [], ...options } = content;
		if (handler.length < 1 || handler.length > 2) {
			// throw enrichError(new Error(''))
			throw new Error(`The function "${
				handler.name || handler.toString().slice(0, 50) + "..."
			}", defined at "${item.file}" has ${handler.length} arguments. 
			In order to use the AutoRoute plugin you need to pass either 1 or 2 arguments.
			Example:
					export default (fastify) => async (request, reply) => ({ good: true });
			Or if you don't need to access fastify:
					export default async (request, reply) => ({ good: true });`);
		}

		if (!Array.isArray(onRequest)) {
			onRequest = [onRequest];
		}

		const wrapped: FastifyPluginAsync = async function (f, opts) {
			f.route({
				method: item.method,
				url: item.route,
				// Probably the hackiest thing I've ever done in my life
				handler: handler.length === 1 ? handler(f) : handler,
				onRequest: onRequest.map((fn: Function) =>
					fn.length === 1 ? fn(f) : fn
				),
				...options,
			});
		};
		fastify.register(wrapped);
	}
};

export default fp(fastifyAutoRoute, {
	fastify: "3.x",
	name: "fastify-autoroute",
});
