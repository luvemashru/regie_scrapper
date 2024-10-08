// slack.service.ts

import { Injectable } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly app: App;

  constructor() {
    const receiver = new ExpressReceiver({
      signingSecret: '',
    });

    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      receiver,
    });

    this.initializeListeners();
  }

  private initializeListeners() {
    // // Listen to messages in Slack
    // this.app.message(async ({ message, say }) => {
    //   // Check if the message has the 'text' property
    //   if ('text' in message && typeof message.text === 'string') {
    //     const text = message.text;

    //     // Call your backend to process the message
    //     await this.processSlackMessage(text);

    //     // Reply back to Slack if needed
    //     await say(`Processing your request for: ${text}`);
    //   } else {
    //     await say('Message does not contain any text to process.');
    //   }
    // });

    // Start the Slack App
    // (async () => {
    //   await this.app.start(3001);
    //   console.log('⚡️ Slack app is running!');
    // })();
  }

  private async processSlackMessage(text: string) {
    // Here you can send the text to your NestJS controller
    // For example, using HTTP to make a request to your endpoint
    try {
      const response = await axios.post('http://localhost:3000/similar-data', {
        text,
      });
      console.log('Similar data:', response.data);
    } catch (error) {
      console.error('Error processing Slack message:', error);
    }
  }
}
