import fg from "fast-glob";
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";

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
		const { default: handler, ...options } = content;
		if (handler.length < 1 || handler.length > 2) {
			// throw enrichError(new Error(''))
			throw new Error(`The function "${
				handler.name || handler.toString().slice(0, 20) + "..."
			}", defined at "${item.file}" has ${handler.length} arguments. 
			In order to use the AutoRoute plugin you need to pass either 1 or 2 arguments.
			Example:
					export default (fastify) => async (request, reply) => ({ good: true });
			Or if you don't need to access fastify:
					export default async (request, reply) => ({ good: true });`);
		}
		const wrapped = async function (f: any, opts: any) {
			f.route({
				method: item.method,
				url: item.route,
				// Probably the hackiest thing I've ever done in my life
				handler: handler.length === 1 ? handler(f) : handler,
				...options,
			});
		};
		fastify.register(wrapped);
	}
	// console.log(parsedRoutes);
};

export default fp(fastifyAutoRoute, {
	fastify: "3.x",
	name: "fastify-autoroute",
});
