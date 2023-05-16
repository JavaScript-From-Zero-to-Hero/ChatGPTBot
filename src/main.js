import { Telegraf, session} from 'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { ogg } from './voiceMessage.js'
import { openAI } from './openAI.js'


const INITIAL_SESSION = {
    messages: [],
};


const bot = new Telegraf(config.get("TELEGRAM_BOT_TOKEN"));

bot.use(session());

bot.command('new', async (context) => {
    context.session = INITIAL_SESSION;
    await context.reply('Новый чат создан!\nЖду Вашего сообщения');
})

bot.command('start', async (context) => {
    context.session = INITIAL_SESSION;
    await context.reply('Здравствуйте! Я ChatGPT, и со мной можно общаться не только текстом, но и голосовыми сообщениями!\n\nКоманда /new позволяет создать новый чат, в котором будет запоминаться контекст, так что на неё лучше нажать.\n\nНу же, напишите мне что-нибудь!');
})


bot.on(message('voice'), async (context) => {
    context.session ??= INITIAL_SESSION
    try {
        await context.reply(code('Запрос обрабатывается...'));
        const voiceMessageLink = await context.telegram.getFileLink(context.message.voice.file_id);
        const userId = (context.message.from.id).toString();
        const oggPath = await ogg.create(voiceMessageLink.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const text = await openAI.transcript(mp3Path);
        await context.reply(code(`Ваш запрос: ${text}`));

        context.session.messages.push({
            role: openAI.roles.USER, 
            content: text 
        });

        const response = await openAI.chat(context.session.messages);

        context.session.messages.push({
            role: openAI.roles.ASSISTANT, 
            content: response.content 
        });

        await context.reply(response.content);

    } catch (error){
        console.log('Error with voice message: ', error.message);
    }
});


bot.on(message('text'), async (context) => {
    context.session ??= INITIAL_SESSION
    try {
        await context.reply(code('Запрос обрабатывается...'));

        context.session.messages.push({
            role: openAI.roles.USER, 
            content: context.message.text 
        });

        const response = await openAI.chat(context.session.messages);

        context.session.messages.push({
            role: openAI.roles.ASSISTANT, 
            content: response.content 
        });

        await context.reply(response.content);

    } catch (error){
        console.log('Error with text message: ', error.message);
    }
});


bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));