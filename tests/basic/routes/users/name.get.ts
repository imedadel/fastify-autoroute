export default (fastify: any) => async (request: any, reply: any) => {
	return {
		usersname: true,
		// @ts-ignore
		loadsFastify: fastify.loadsFastify,
	};
};
