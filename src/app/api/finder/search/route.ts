import { fail, ok } from "@/lib/api/response";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit/memory-rate-limit";
import { finderQuerySchema } from "@/modules/finder/finder.schema";
import { finderService } from "@/modules/finder/finder.service";

const readQuery = (request: Request) => {
	const url = new URL(request.url);
	const query = url.searchParams.get("q") ?? undefined;
	const level = url.searchParams.get("level")?.toUpperCase();
	return finderQuerySchema.parse({ query, level });
};

export async function GET(request: Request) {
	try {
		enforceRateLimit(`finder:${getRequestIp(request.headers)}`, 12);
		const { query, level } = readQuery(request);
		return ok(await finderService.search(query, level));
	} catch (error) {
		return fail(error);
	}
}

export async function POST(request: Request) {
	try {
		enforceRateLimit(`finder:${getRequestIp(request.headers)}`, 12);
		const body = finderQuerySchema.parse(await request.json());
		return ok(await finderService.search(body.query, body.level));
	} catch (error) {
		return fail(error);
	}
}
