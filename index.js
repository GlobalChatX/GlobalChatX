const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = '!';

client.login("your-token");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    // ゲームのプレイステータスを設定
    client.user.setActivity(`${client.guilds.size}個のサーバーで`, { type: 'PLAYING' });
});

client.on('message', message => {
    // 既存のメッセージイベントの処理を継続
    if (message.author.bot) return;

    if (message.channel.name === 'グローバルチャット') {
        if (message.attachments.size <= 0) {
            message.delete();
        }

        const globalChatEmbed = new Discord.RichEmbed()
            .setAuthor(message.author.tag, message.author.avatarURL)
            .setColor(0x2C2F33)
            .setFooter(message.guild.name, message.guild.iconURL)
            .setTimestamp();

        if (message.attachments.size <= 0) {
            globalChatEmbed.setDescription(message.content);
        } else {
            const attachment = message.attachments.first();
            globalChatEmbed.setImage(attachment.url);
            globalChatEmbed.setDescription(attachment.url);
        }

        if (message.content.includes('!tiket')) {
            globalChatEmbed.addField('詳細情報', `**${message.author.tag}** がグローバルチャットでチケットを要求しました。`);
        } else if (message.reference && message.reference.messageID) {
            const repliedMessage = message.channel.messages.get(message.reference.messageID);
            if (repliedMessage) {
                globalChatEmbed.addField('詳細情報', `**${message.author.tag}** が **${repliedMessage.author.tag}** に返信しました。\nユーザーID: ${message.author.id}\n返信されたユーザー: ${repliedMessage.author.tag}`);
            }
        }

        client.channels.forEach(channel => {
            if (channel.name === 'グローバルチャット') {
                channel.send(globalChatEmbed);
            }
        });
    }
});

client.on('message', message => {
    // 既存のメッセージイベントの処理を継続
    if (message.author.bot) return;

    if (message.channel.type === 'dm') {
        const responseMessage = '# DMありがとうございます \n ## 何か不具合でもありましたか？もしありましたらサポートサーバーでチケットを作成してください。 \n # チケットは"!tiket"で作れます';
        message.author.send(responseMessage)
            .then(sentMessage => console.log(`Sent a DM response to ${sentMessage.author.tag}`))
            .catch(error => console.error(`Error sending DM response: ${error.message}`));
    }
});

// チケットの数を格納する変数
let ticketCounter = 1;

client.on('message', message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'tiket') {
        // チケット用のプライベートチャンネル名を作成
        const ticketChannelName = `tiket-${ticketCounter}`;

        // チケット用のプライベートチャンネルを作成
        message.guild.createChannel(ticketChannelName, {
            type: 'text',
            permissionOverwrites: [
                {
                    id: message.author.id, // 作成した人のID
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                },
                {
                    id: message.guild.id, // サーバーのID
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: message.guild.roles.find(role => role.name === '管理者').id, // 管理者ロールのID
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                },
            ],
        }).then(ticketChannel => {
            // チケット用のメッセージを送信
            ticketChannel.send('チケットが作成されました！');

            // チケットの数を増やす
            ticketCounter++;
        }).catch(error => {
            console.error(`エラーが発生しました: ${error.message}`);
        });
    }
});

