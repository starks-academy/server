import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "@app/common/decorators/public.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
    @Public()
    @Get()
    @ApiOperation({ summary: "Health check endpoint" })
    @ApiResponse({
        status: 200,
        description: "Service is healthy",
        schema: {
            type: "object",
            properties: {
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", example: "2026-03-19T12:00:00.000Z" },
                uptime: { type: "number", example: 123.456 },
            },
        },
    })
    check() {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
}
