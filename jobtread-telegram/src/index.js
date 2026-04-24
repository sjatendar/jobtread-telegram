import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JOBTREAD_GRANT_KEY = process.env.JOBTREAD_GRANT_KEY;
const JOBTREAD_API = 'https://api.jobtread.com/pave';

if (!TELEGRAM_TOKEN) {
    console.error('ERROR: TELEGRAM_BOT_TOKEN environment variable is not set.');
    process.exit(1);
}
if (!JOBTREAD_GRANT_KEY) {
    console.error('ERROR: JOBTREAD_GRANT_KEY environment variable is not set.');
    process.exit(1);
}

async function paveQuery(queryObj) {
    const response = await fetch(JOBTREAD_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
                  query: {
                            $: { grantKey: JOBTREAD_GRANT_KEY },
                            ...queryObj,
                  },
          }),
    });
    if (!response.ok) throw new Error(`JobTread API error: ${response.status}`);
    return response.json();
}

const ORG_ID = process.env.JOBTREAD_ORG_ID || '22NmLCnfViW4';

async function listJobs(size = 25) {
    const data = await paveQuery({
          organization: {
                  $: { id: ORG_ID },
                  jobs: {
                            $: { size },
                            nodes: { id: {}, name: {}, number: {}, startDate: {}, account: { name: {} } },
                  },
          },
    });
    return data?.data?.organization?.jobs?.nodes ?? [];
}

async function searchJobs(query) {
    const data = await paveQuery({
          organization: {
                  $: { id: ORG_ID },
                  jobs: {
                            $: { size: 20, where: [['name', 'contains', query]] },
                            nodes: { id: {}, name: {}, number: {}, startDate: {}, account: { name: {} } },
                  },
          },
    });
    return data?.data?.organization?.jobs?.nodes ?? [];
}

async function listCustomers() {
    const data = await paveQuery({
          organization: {
                  $: { id: ORG_ID },
                  accounts: {
                            $: { size: 30 },
                            nodes: { id: {}, name: {}, type: {} },
                  },
          },
    });
    return data?.data?.organization?.accounts?.nodes ?? [];
}

function formatJobList(jobs) {
    if (!jobs.length) return 'No jobs found.';
    return jobs.map((j) => {
          const num = j.number ? `#${j.number}` : j.id;
          const customer = j.account?.name ?? 'No customer';
          const date = j.startDate ? ` | ${j.startDate}` : '';
          return `- ${j.name} (${num}) | ${customer}${date}`;
    }).join('\n');
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const HELP_TEXT = `Citystone JobTread Bot

Coimport TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JOBTREAD_GRANT_KEY = process.env.JOBTREAD_GRANT_KEY;
const JOBTREAD_API = 'https://api.jobtread.com/pave';

if (!TELEGRAM_TOKEN) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN environment variable is not set.');
    process.exit(1);
    }
    if (!JOBTREAD_GRANT_KEY) {
      console.error('ERROR: JOBTREAD_GRANT_KEY environment variable is not set.');
        process.exit(1);
        }

        async function paveQuery(queryObj) {
          const response = await fetch(JOBTREAD_API, {
              method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                            query: {
                                    $: { grantKey: JOBTREAD_GRANT_KEY },
                                            ...queryObj,
                                                  },
                                                      }),
                                                        });
                                                          if (!response.ok) throw new Error(`JobTread API error: ${response.status}`);
                                                            return response.json();
                                                            }

                                                            const ORG_ID = process.env.JOBTREAD_ORG_ID || '22NmLCnfViW4';

                                                            async function listJobs(size = 25) {
                                                              const data = await paveQuery({
                                                                  organization: {
                                                                        $: { id: ORG_ID },
                                                                              jobs: {
                                                                                      $: { size },
                                                                                              nodes: { id: {}, name: {}, number: {}, startDate: {}, account: { name: {} } },
                                                                                                    },
                                                                                                        },
                                                                                                          });
                                                                                                            return data?.data?.organization?.jobs?.nodes ?? [];
                                                                                                            }
                                                                                                            
                                                                                                            async function searchJobs(query) {
                                                                                                              const data = await paveQuery({
                                                                                                                  organization: {
                                                                                                                        $: { id: ORG_ID },
                                                                                                                              jobs: {
                                                                                                                                      $: { size: 20, where: [['name', 'contains', query]] },
                                                                                                                                              nodes: { id: {}, name: {}, number: {}, startDate: {}, account: { name: {} } },
                                                                                                                                                    },
                                                                                                                                                        },
                                                                                                                                                          });
                                                                                                                                                            return data?.data?.organization?.jobs?.nodes ?? [];
                                                                                                                                                            }
                                                                                                                                                            
                                                                                                                                                            async function listCustomers() {
                                                                                                                                                              const data = await paveQuery({
                                                                                                                                                                  organization: {
                                                                                                                                                                        $: { id: ORG_ID },
                                                                                                                                                                              accounts: {
                                                                                                                                                                                      $: { size: 30 },
                                                                                                                                                                                              nodes: { id: {}, name: {}, type: {} },
                                                                                                                                                                                                    },
                                                                                                                                                                                                        },
                                                                                                                                                                                                          });
                                                                                                                                                                                                            return data?.data?.organization?.accounts?.nodes ?? [];
                                                                                                                                                                                                            }
                                                                                                                                                                                                            
                                                                                                                                                                                                            function formatJobList(jobs) {
                                                                                                                                                                                                              if (!jobs.length) return 'No jobs found.';
                                                                                                                                                                                                                return jobs.map((j) => {
                                                                                                                                                                                                                    const num = j.number ? `#${j.number}` : j.id;
                                                                                                                                                                                                                        const customer = j.account?.name ?? 'No customer';
                                                                                                                                                                                                                            const date = j.startDate ? ` | ${j.startDate}` : '';
                                                                                                                                                                                                                                return `- ${j.name} (${num}) | ${customer}${date}`;
                                                                                                                                                                                                                                  }).join('\n');
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                  const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                  const HELP_TEXT = `Citystone JobTread Bot

Commands:
/jobs - List recent jobs
/search [term] - Search jobs by name
/customers - List all customers
/help - Show this message`;

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, HELP_TEXT);
  });

  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, HELP_TEXT);
    });

    bot.onText(/\/jobs/, async (msg) => {
      const chatId = msg.chat.id;
        const loading = await bot.sendMessage(chatId, 'Fetching jobs...');
          try {
              const jobs = await listJobs(25);
                  const text = `Recent Jobs (${jobs.length}):\n\n${formatJobList(jobs)}`;
                      await bot.editMessageText(text, { chat_id: chatId, message_id: loading.message_id });
                        } catch (err) {
                            await bot.editMessageText(`Error: ${err.message}`, { chat_id: chatId, message_id: loading.message_id });
                              }
                              });

                              bot.onText(/\/search (.+)/, async (msg, match) => {
                                const chatId = msg.chat.id;
                                  const query = match[1].trim();
                                    const loading = await bot.sendMessage(chatId, `Searching for "${query}"...`);
                                      try {
                                          const jobs = await searchJobs(query);
                                              const text = jobs.length ? `Results for "${query}" (${jobs.length}):\n\n${formatJobList(jobs)}` : `No jobs found matching "${query}".`;
    await bot.editMessageText(text, { chat_id: chatId, message_id: loading.message_id });
      } catch (err) {
          await bot.editMessageText(`Error: ${err.message}`, { chat_id: chatId, message_id: loading.message_id });
            }
            });

            bot.onText(/\/customers/, async (msg) => {
              const chatId = msg.chat.id;
                const loading = await bot.sendMessage(chatId, 'Fetching customers...');
                  try {
                      const customers = await listCustomers();
                          if (!customers.length) {
                                await bot.editMessageText('No customers found.', { chat_id: chatId, message_id: loading.message_id });
                                      return;
                                          }
                                              const text = `Customers (${customers.length}):\n\n` + customers.map((c) => `- ${c.name} (${c.type})`).join('\n');
                                                  await bot.editMessageText(text, { chat_id: chatId, message_id: loading.message_id });
                                                    } catch (err) {
                                                        await bot.editMessageText(`Error: ${err.message}`, { chat_id: chatId, message_id: loading.message_id });
                                                          }
                                                          });

                                                          bot.on('message', (msg) => {
                                                            if (msg.text && !msg.text.startsWith('/')) {
                                                                bot.sendMessage(msg.chat.id, 'Type /help to see available commands.');
                                                                  }
                                                                  });

                                                                  console.log('Citystone JobTread Telegram bot running...');
