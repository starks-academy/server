import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Public } from "@app/common/decorators/public.decorator";
import { ChallengeRequestDto } from "./dto/challenge-request.dto";
import { VerifySignatureDto } from "./dto/verify-signature.dto";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post("challenge")
  @ApiOperation({ summary: "Request a wallet sign challenge nonce" })
  @ApiResponse({ status: 201, description: "Challenge nonce generated" })
  generateChallenge(@Body() dto: ChallengeRequestDto) {
    return this.authService.generateChallenge(dto.walletAddress);
  }

  @Public()
  @Post("verify")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify signed challenge and receive JWT" })
  @ApiResponse({ status: 200, description: "JWT tokens issued" })
  @ApiResponse({ status: 401, description: "Invalid signature" })
  async verifySignature(@Body() dto: VerifySignatureDto) {
    try {
      return await this.authService.verifySignature(dto);
    } catch (error) {
      console.error("[AuthController] verifySignature error:", error);
      throw error;
    }
  }
}
