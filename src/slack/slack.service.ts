// slack.service.ts

import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import axios from 'axios';
import { VectorService } from 'src/vector/vector.service';

@Injectable()
export class SlackService {
  private readonly app: App;
  private readonly SLACK_APP_TOKEN: string;
  private readonly SLACK_BOT_TOKEN: string;
  private readonly SIGING_SECRET: string;

  constructor(
    private readonly vectorService: VectorService
  ) {
    this.SLACK_BOT_TOKEN = "";
    this.SLACK_APP_TOKEN = "";
    this.SIGING_SECRET = "";

    this.app = new App({
      token: this.SLACK_BOT_TOKEN,
      signingSecret: this.SIGING_SECRET,
      appToken: this.SLACK_APP_TOKEN,
      socketMode: true,

    });

    this.app.command('/info-bot', async ({command, ack, say}) => {
      await ack();
      const message = command.text
      say(`${message}, searching....`);
      const response = await this.vectorService.findSimilarParagraph(message)
      if(response?.sufficient) say(`${response.message}`)
      else {
        say('Not sufficient information to answer the query')
      }
    })

    this.initializeListeners();
  }

  private async initializeListeners() {
    await this.app.start(3001)
    console.log('App is running on port 3001')
  }
}
