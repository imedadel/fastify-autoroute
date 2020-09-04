import * as Fastify from "fastify";
import basic from "./app";

const app = Fastify.fastify({
	ignoreTrailingSlash: true,
});
app.register(basic);

describe("Load AutoRoute plugin correctly", () => {
	beforeAll((done) => {
		app.ready(done);
	});

	it("supports index routes", async () => {
		const { payload, statusCode } = await app.inject({
			url: "/",
		});
		expect(statusCode).toBe(200);
		expect(JSON.parse(payload)).toMatchObject({ index: true });
	});

	it("supports catch all routes", async () => {
		const { payload, statusCode } = await app.inject({
			url: "/teams/test",
		});
		expect(statusCode).toBe(200);
		expect(JSON.parse(payload)).toMatchObject({ idslugget: true });
	});

	it("supports simple dynamic routes", async () => {
		const inFile = await app.inject({
			url: "/teams/test",
			method: "POST",
		});

		const inFolder = await app.inject({
			url: "/users/test",
			method: "GET",
		});
		expect(inFile.statusCode).toBe(200);
		expect(JSON.parse(inFile.payload)).toMatchObject({
			idpost: true,
			params: { id: "test" },
		});

		expect(inFolder.statusCode).toBe(200);
		expect(JSON.parse(inFolder.payload)).toMatchObject({
			idindex: true,
			params: { id: "test" },
		});
	});

	it("supports double dynamic routes", async () => {
		const { payload, statusCode } = await app.inject({
			url: "/teams/test-87",
			method: "DELETE",
		});
		expect(statusCode).toBe(200);
		expect(JSON.parse(payload)).toMatchObject({
			iddelete: true,
			params: { id: "test", n: "87" },
		});
	});

	it("expands 'ALL' method", async () => {
		const methods = [
			"GET",
			"HEAD",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
			"PATCH",
		];
		for (const method of methods) {
			const result = await app.inject({
				url: "/users/card",
				// @ts-ignore
				method: method,
			});
			expect(result.statusCode).toBe(200);
			expect(JSON.parse(result.payload)).toMatchObject({ usercard: true });
		}
	});

	it("passes Fastify instance", async () => {
		const loads = await app.inject({
			url: "/users/name",
			method: "GET",
		});

		expect(loads.statusCode).toBe(200);
		expect(JSON.parse(loads.payload)).toMatchObject({
			usersname: true,
			loadsFastify: true,
		});
	});
});
