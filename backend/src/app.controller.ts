import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Blockchain Explorer API'
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  }
}
