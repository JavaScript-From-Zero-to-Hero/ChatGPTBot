import { Configuration, OpenAIApi } from 'openai'
import { createReadStream } from 'fs'
import config from 'config'


class OpenAI {
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system'
    };


    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
          });

          this.openai = new OpenAIApi(configuration);
    }

    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: messages,
            })

            return response.data.choices[0].message
        } catch (error) {
            console.log('Error while gpt chat: ', error.message);
        }
    }

    async transcript(filePath) {
        try {
            const response = await this.openai.createTranscription(
                createReadStream(filePath),
                'whisper-1'
            );

            return response.data.text
        } catch (error) {
            console.log('Error while transcripting: ', error.message);
        }


    }
}

export const openAI = new OpenAI(config.get('OPENAI_KEY'));