// Local-only mock of the public read API, for eyeballing the Hall of Fame UI with test data.
// No database, backend, or secrets needed. Nothing here is real staff data.
//
//   node scripts/dev/mock-api.mjs          (listens on 127.0.0.1:8000, what vite proxies /api to)
//   cd frontend/app && npm run dev         (then open /instant-impact or /charter-champions)
//
// Months: Nov=9 (incl. Golden Ticket), Oct=5, Sep=2, Aug=1, Jul=12, Jun=0 (empty state).
import http from 'node:http'

const PORT = Number(process.env.MOCK_API_PORT || 8000)

const people = [
  ['Dudley', 'Fitch', 'Supervisor Commercial Sales', 'Commercial Sales'],
  ['Damien', 'Ladouce', 'Information System Trainee', 'Information Systems'],
  ['Dominique', 'Chang-Time', 'Information System Specialist - IS/Bill/CC', 'Information Systems'],
  ['Amy', 'Morel', 'Agent', 'Contact Centre'],
  ['Jon', 'Pillay', 'Technician', 'Field Operations'],
  ['Lea', 'Bonnelame', 'Senior Network Engineer', 'Network'],
  ['Marie-Therese', 'Esparon-Dupres', 'Senior Customer Experience Analyst', 'Customer Experience'],
  ['Kevin', 'Hoareau', 'Retail Consultant', 'Retail'],
  ['Sandra', 'Payet', 'Billing Officer', 'Finance'],
  ['Ravi', 'Naidoo', 'Field Technician', 'Field Operations'],
  ['Natasha', 'Accouche', 'Team Leader - Enterprise Support', 'Enterprise'],
  ['Brian', 'Marengo', 'Systems Administrator', 'Information Systems'],
]
const pillars = [
  'Customer Centricity & Insights Driven',
  'Proactive Problem Solving, Urgency & Ownership',
  'Collaboration',
  'Innovation & Continuous Improvement',
]
const stories = {
  long: 'The eTopup project aimed to replace a significantly outdated system that had been in use at Cable & Wireless since 2007. The legacy system had been an audit finding for more than four years and was also included on the risk register. The project involved five months of work, including extensive preparation and overnight efforts to execute the cutover. The team coordinated the migration of more than 600 dealers to the new platform. This involved providing training, troubleshooting, performing dealer reconciliations, helping dealers become familiar with the new system and assisting with post-migration issues, ensuring a smoother transition for dealers.',
  medium: 'Went beyond the assigned duties to support the go-live, testing and migrating services so customers saw no interruption during the cutover weekend.',
  short: 'Stayed late to restore the billing queue for 200 affected customer accounts.',
  tiny: 'Always goes the extra mile.',
}
const storyKeys = ['long', 'short', 'medium', 'long', 'tiny', 'medium', 'short', 'long']
const nominators = ['Nelson Confait', 'Priya Samuel', 'A. Verlaque']
const subs = {
  INSTANT_IMPACT: ['Service Delivery', 'Innovation', 'Teamwork'],
  CHARTER_CHAMPION: ['Team Player', 'Leadership'],
}
const counts = { 11: 9, 10: 5, 9: 2, 8: 1, 7: 12, 6: 0 }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

let id = 0
const winners = []
for (const type of ['INSTANT_IMPACT', 'CHARTER_CHAMPION']) {
  for (const [m, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) {
      const p = people[(i + Number(m)) % people.length]
      const k = (i + Number(m)) % pillars.length
      winners.push({
        id: ++id,
        first_name: p[0],
        last_name: p[1],
        job_title: p[2],
        department: p[3],
        award_type: type,
        subcategory: subs[type][i % subs[type].length],
        charter_pillars: i % 3 === 2 ? [pillars[k]] : [pillars[k], pillars[(k + 1) % pillars.length]],
        company_values: [],
        story: stories[storyKeys[(i + Number(m)) % storyKeys.length]],
        nominated_by: nominators[i % nominators.length],
        award_month: `${MONTHS[Number(m) - 1]} 2026`,
        award_year: 2026,
        golden_ticket: type === 'INSTANT_IMPACT' && m === '11' && i === 0,
        golden_ticket_occasion: null,
        is_top_five: false,
        top_five_rank: null,
        top_five_year: null,
        photo_url: null,
        status: 'PUBLISHED',
      })
    }
  }
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    res.setHeader('content-type', 'application/json')
    if (url.pathname.endsWith('/winners')) {
      const type = url.searchParams.get('award_type')
      const month = url.searchParams.get('month')
      const year = url.searchParams.get('year')
      const list = winners.filter(
        (w) =>
          (!type || w.award_type === type) &&
          (!month || w.award_month === month) &&
          (!year || String(w.award_year) === year),
      )
      return res.end(JSON.stringify({ winners: list, total: list.length }))
    }
    if (url.pathname.endsWith('/config/subcategories')) {
      const type = url.searchParams.get('award_type')
      const list = (type ? [type] : Object.keys(subs)).flatMap((t) =>
        subs[t].map((name, i) => ({ id: i + 1, name, award_type: t, sort_order: i })),
      )
      return res.end(JSON.stringify(list))
    }
    res.end('[]')
  })
  .listen(PORT, '127.0.0.1', () => console.log(`mock API on http://127.0.0.1:${PORT}`))
