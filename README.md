# Fastify AutoRoute

> Next.js file routing for Fastify.

If you're familiar with Next.js, you know how awesome the routing is. If not, have a look on their [documentation](https://nextjs.org/docs/routing/dynamic-routes) :)

AutoRoute gives you exactly the same routing (except for optional catch all routes, they can't be done in Fastify or they're inherently supported, _je sais pas_ 🤷‍♀️).

# Install

```shell
yarn add fastify-autoroute
# or
npm i fastify-autoroute
```

# Usage

Add AutoRoute as a plugin to Fastify:

```ts
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
```

# Options

- **autoRouteDir** (required, string) — this is the root folder of your routes. This is similar to Next.js `/pages`.

# Structure

> I tried explaining this, but instead here is an example

For the following directory:

```
├───routes
│   ├───users
│   │   ├───[id]
│   │   │   ├───index.get.ts
│   │   │   ├───index.delete.ts
│   │   │   ├───name.get.ts
│   │   │   └───email.get.ts
│   │   └───index.post.ts
│   ├───teams
│   │   ├───[...slug].get.ts
│   └───index.get.ts
```

You will get the following Fastify routes:

```
GET	/
POST	/users
GET	/users/name
GET	/users/email
GET	/users/:id
DELETE	/users/:id
GET /teams/*
```

**Note.** the method `all` is expanded into all the methods supported by Fastify.
So, `name.all.ts` is expanded into

```
GET /name
POST /name
PUT /name
...
```

# File content

The default export is passed as a `handler` to `fastify.route()`. All other named exports are bassed as options to `fastify.route()` too.

```ts
export const schema = {};
export const onRequest = [];
export default async (request: FastifyRequest, reply: FastifyReply) => {
	return { ok: true };
};
```

## Accessing Fastify

In order to access Fastify and its decorators, you can use the following structure:

```ts
export default (fastify: FastifyInstance) => async (
	request: FastifyRequest,
	reply: FastifyReply
) => {
	return {
		config: fastify.config,
	};
};
```

# Unresolved issues

- **Typing:** Can't it be nicer? Like automatic typing for every exported function? Is that possible in Typescript?
- **More errors:** There should be more errors and checks for when users misuse this plugin.

# Author

Imed Adel ([Twitter](https://twitter.com/imedadel_))

# License

MIT
