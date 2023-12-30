const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = '!';
let globalChatEnabled = true;
let ticketCounter = 1;

client.login("TOKEN");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    updateActivity();
});
  
  // Add this function
function updateActivity() {
    // guilds プロパティが存在するか確認
    const guildsCount = client.guilds && client.guilds.size ? client.guilds.size : 0;
    client.user.setActivity(`${guildsCount}個のサーバーで`, { type: 'PLAYING' });
}
  
  // Listen for guild events
client.on('guildCreate', updateActivity);
client.on('guildDelete', updateActivity);
  
client.on('message', message => {
  if (message.author.bot) return;

  if (message && message.channel.name === 'グローバルチャット' && globalChatEnabled) {
    if (message.attachments.size <= 0) {
      if (message.channel.permissionsFor(client.user).has('MANAGE_MESSAGES')) {
        message.delete();
      } else {
        console.error("Bot does not have permission to delete messages.");
      }
    }

    const globalChatEmbed = new Discord.MessageEmbed()
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setColor(0x2C2F33)
      .setFooter(message.guild.name, message.guild.iconURL())
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
      const repliedMessage = message.channel.messages.cache.get(message.reference.messageID);
      if (repliedMessage) {
        globalChatEmbed.addField('詳細情報', `**${message.author.tag}** が **${repliedMessage.author.tag}** に返信しました。\nユーザーID: ${message.author.id}\n返信されたユーザー: ${repliedMessage.author.tag}`);
      }
    }

    client.channels.cache.forEach(channel => {
      if (channel.name === 'グローバルチャット') {
        channel.send({ embeds: [globalChatEmbed] });
      }
    });
  }

  if (message.channel.type === 'dm') {
    // DMへの返信
    const responseMessage = '# DMありがとうございます \n ## 何か不具合でもありましたか？もしありましたらサポートサーバーでチケットを作成してください。 \n # チケットは"!tiket"で作れます';
    message.author.send(responseMessage)
      .then(sentMessage => console.log(`Sent a DM response to ${sentMessage.author.tag}`))
      .catch(error => console.error(`Error sending DM response: ${error.message}`));
  }

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ticket') {
      // チケット作成コマンドの処理
      const isAdmin = message.member ? message.member.roles.some(role => role.name === '管理者') : false;

      if (isAdmin || message.author.id === message.guild.ownerID) {
        // 管理者ロールを持つメンバーまたはサーバーオーナーだけが実行可能
        const ticketChannelName = `ticket-${ticketCounter}`;

        message.guild.channels.create(ticketChannelName, {
          type: 'text',
          permissionOverwrites: [
            {
              id: message.author.id, // チケットを作成した人のID
              allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
            },
            {
              id: message.guild.id, // サーバーのID
              deny: ['VIEW_CHANNEL'],
            },
            {
              id: 'ROLE_ID', // 管理者ロールのID（実際のIDに置き換える）
              allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
            },
          ],
        }).then(ticketChannel => {
          ticketChannel.send('チケットが作成されました！');
          ticketCounter++;
        }).catch(error => {
          console.error(`エラーが発生しました: ${error.message}`);
        });
      } else {
        message.reply('権限がありません！');
      }
    } else if (command === 'on') {
      // グローバルチャットの有効化コマンド
      globalChatEnabled = true;
      message.reply('グローバルチャットが有効になりました！');
    } else if (command === 'off') {
      // グローバルチャットの無効化コマンド
      globalChatEnabled = false;
      message.reply('グローバルチャットが無効になりました！');
    }
  }
});
