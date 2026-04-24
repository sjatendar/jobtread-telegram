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

// ─── JobTread API ────────────────────────────────────────────────────────────

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

let cachedOrgId = null;
async function getOrgId() {
  if (cachedOrgId) return cachedOrgId;
  const data = await paveQuery({
    currentGrant: {
      user: {
        memberships: { nodes: { organization: { id: {}, name: {} } } },
      },
    },
  });
  const orgs = data?.data?.currentGrant?.user?.memberships?.nodes;
  if (!orgs?.length) throw new Error('No organizations found.');
  cachedOrgId = orgs[0].organization.id;
  return cachedOrgId;
}

// ─── Job Queries ─────────────────────────────────────────────────────────────

async function listJobs(size = 20) {
  const orgId = await getOrgId();
  const data = await paveQuery({
    organization: {
      $: { id: orgId },
      jobs: {
        $: { size },
        nodes: {
          id: {},
          name: {},
          number: {},
          startDate: {},
          account: { name: {} },
        },
      },
    },
  });
  return data?.data?.organization?.jobs?.nodes ?? [];
}

async function searchJobs(query) {
  const orgId = await getOrgId();
  const data = await paveQuery({
    organization: {
      $: { id: orgId },
      jobs: {
        $: { size: 20, where: [['name', 'contains', query]] },
        nodes: {
          id: {},
          name: {},
          number: {},
          startDate: {},
          account: { name: {} },
        },
      },
    },
  });
  return data?.data?.organization?.jobs?.nodes ?? [];
}

async function getJob(jobId) {
  const data = await paveQuery({
    job: {
      $: { id: jobId },
      id: {},
      name: {},
      number: {},
      startDate: {},
      description: {},
      account: { name: {} },
      costItems: {
        $: { size: 20 },
        nodes: { name: {}, quantity: {}, unitCost: {}, unitPrice: {} },
      },
    },
  });
  return data?.data?.job ?? null;
}

async function listCustomers() {
  const orgId = await getOrgId();
  const data = await paveQuery({
    organization: {
      $: { id: orgId },
      accounts: {
        $: { size: 30 },
        nodes: { id: {}, name: {}, type: {} },
      },
    },
  });
  return data?.data?.organization?.accounts?.nodes ?? [];
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

function formatJobList(jobs) {
  if (!jobs.length) return '❌ No jobs found.';
  return jobs
    .map((j) => {
      const num = j.number ? `#${j.number}` : j.id;
      const customer = j.account?.name ?? 'No customer';
      const date = j.startDate ? ` | 📅 ${j.startDate}` : '';
      return `• *${j.name}* (${num})\n  👤 ${customer}${date}`;
    })
    .join('\n\n');
}

function formatJobDetail(job) {
  if (!job) return '❌ Job not found.';
  const lines = [
    `🏗 *${job.name}*`,
    `Number: ${job.number ?? 'N/A'}`,
    `Customer: ${job.account?.name ?? 'N/A'}`,
    `Start Date: ${job.startDate ?? 'N/A'}`,
    `Description: ${job.description ?? 'N/A'}`,
  ];
  const costs = job.costItems?.nodes ?? [];
  if (costs.length) {
    lines.push(`\n📋 *Cost Items (${costs.length}):*`);
    costs.forEach((c) => {
      lines.push(`  • ${c.name} — Qty: ${c.quantity ?? 1} | Cost: $${c.unitCost ?? 0} | Price: $${c.unitPrice ?? 0}`);
    });
  }
  return lines.join('\n');
}

// ─── Bot Setup ────────────────────────────────────────────────────────────────

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const HELP_TEXT = `
🏗 *Citystone JobTread Bot*

Commands:
/jobs — List recent jobs
/search \\[term\\] — Search jobs by name
/customers — List all customers
/help — Show this message

Examples:
  /search Smith
  /search 123
`.trim();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, HELP_TEXT, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, HELP_TEXT, { parse_mode: 'Markdown' });
});

bot.onText(/\/jobs/, async (msg) => {
  const chatId = msg.chat.id;
  const loading = await bot.sendMessage(chatId, '⏳ Fetching jobs...');
  try {
    const jobs = await listJobs(25);
    const text = `📋 *Recent Jobs (${jobs.length}):*\n\n${formatJobList(jobs)}`;
    await bot.editMessageText(text, { chat_id: chatId, message_id: loading.message_id, parse_mode: 'Markdown' });
  } catch (err) {
    await bot.editMessageText(`❌ Error: ${err.message}`, { chat_id: chatId, message_id: loading.message_id });
  }
});

bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1].trim();
  const loading = await bot.sendMessage(chatId, `⏳ Searching for "${query}"...`);
  try {
    const jobs = await searchJobs(query);
    const text = jobs.length
      ? `🔍 *Results for "${query}" (${jobs.length}):*\n\n${formatJobList(jobs)}`
      : `❌ No jobs found matching "${query}".`;
    await bot.editMessageText(text, { chat_id: chatId, message_id: loading.message_id, parse_mode: 'Markdown' });
  } catch (err) {
    await bot.editMessageText(`❌ Error: ${err.message}`, { chat_id: chatId, message_id: loading.message_id });
  }
});

bot.onText(/\/customers/, async (msg) => {
  const chatId = msg.chat.id;
  const loading = await bot.sendMessage(chatId, '⏳ Fetching customers...');
  try {
    const customers = await listCustomers();
    if (!customers.length) {
      await bot.editMessageText('❌ No customers found.', { chat_id: chatId, message_id: loading.message_id });
      return;
    }
    const text = `👥 *Customers (${customers.length}):*\n\n` +
      customers.map((c) => `• ${c.name} _(${c.type})_`).join('\n');
    await bot.editMessageText(text, { chat_id: chatId, message_id: loading.message_id, parse_mode: 'Markdown' });
  } catch (err) {
    await bot.editMessageText(`❌ Error: ${err.message}`, { chat_id: chatId, message_id: loading.message_id });
  }
});

// Fallback for unrecognized messages
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Type /help to see available commands.`);
  }
});

console.log('🤖 Citystone JobTread Telegram bot is running...');
