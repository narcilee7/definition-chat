import { Injectable } from '@nestjs/common';
import { RiskDetectionResult } from '@ohme/prompts';

@Injectable()
export class CrisisInterventionService {
  getInterventionResponse(riskResult: RiskDetectionResult): string {
    switch (riskResult.riskLevel) {
      case 'imminent':
        return this.getImminentResponse();
      case 'high':
        return this.getHighResponse();
      case 'moderate':
        return this.getModerateResponse();
      default:
        return '';
    }
  }

  private getImminentResponse(): string {
    return `我听到你现在正处于非常痛苦的状态。你的安全对我来说是最重要的。\n\n我想确认：**你现在有伤害自己的计划吗？你手头有可以做这件事的东西吗？**\n\n请告诉我，这样我才能帮你找到安全的办法。\n\n同时，请你现在联系：\n📞 **全国希望 24 热线：400-161-9995**\n📞 **北京心理危机干预中心：010-82951332**\n\n你不是一个人。`;
  }

  private getHighResponse(): string {
    return `我注意到你提到了一些让我很担心的内容。我想更好地了解你的状况，这样我才能帮你。\n\n你愿意告诉我更多吗？比如：\n- 这个想法有多强烈？\n- 你有过具体的计划吗？\n- 现在有什么让你还在坚持？\n\n如果你感到不安全，请立即联系：\n📞 **全国希望 24 热线：400-161-9995**\n\n我在这里陪着你。`;
  }

  private getModerateResponse(): string {
    return `我听到你说...（反映情绪）。这种感觉一定很难受。\n\n我想确认一下：**你有想过具体怎么做吗？**还是只是一种感觉？\n\n了解这些能帮助我更好地支持你。`;
  }
}
