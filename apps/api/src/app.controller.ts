import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "@app/common/decorators/public.decorator";

@ApiTags("root")
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: "API root - returns API information" })
  getRoot() {
    return {
      name: "Stacks Academy API",
      version: "1.0.0",
      description:
        "Production-grade backend for the Stacks Academy learning platform",
      endpoints: {
        health: `/${process.env.API_PREFIX || "api/v1"}/health`,
        docs: `/${process.env.API_PREFIX || "api/v1"}/docs`,
      },
      status: "operational",
    };
  }
}
