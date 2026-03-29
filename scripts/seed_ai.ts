/**
 * WIAL AI Knowledge Engine — Seed Data
 *
 * Seeds demo journal articles (with OpenAI embeddings) and upcoming webinars.
 *
 * Prerequisites:
 *   - supabase/migrations/00012_knowledge_engine.sql applied
 *   - supabase/migrations/00013_knowledge_search_fn.sql applied
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... OPENAI_API_KEY=... npm run db:seed:ai
 */

import { createClient } from '@supabase/supabase-js'
import { embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL']
const SECRET_KEY = process.env['SUPABASE_SECRET_KEY']

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.')
  process.exit(1)
}

if (!process.env['OPENAI_API_KEY']) {
  console.error('Missing OPENAI_API_KEY.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const articles = [
  {
    title: 'The Impact of Action Learning on Employee Retention in Healthcare',
    authors: ['Dr. Sarah Jenkins', 'Michael Marquardt'],
    published_year: 2023,
    summary:
      'This study investigates how Action Learning programs influence employee retention within large healthcare networks. The findings demonstrate a 24% reduction in turnover among nursing staff who participated in cross-functional Action Learning groups compared to a control group. The structured problem-solving approach helped nurses feel more valued, fostered interdepartmental empathy, and built a stronger localized support system.',
    key_findings: [
      { finding: '24% reduction in nursing turnover', tags: ['healthcare', 'employee-retention'] },
      { finding: 'Improved interdepartmental empathy', tags: ['team-performance'] },
    ],
    relevance_tags: ['healthcare', 'employee-retention', 'team-performance'],
    translations: {
      es: {
        summary:
          'Este estudio investiga cómo los programas de Aprendizaje en Acción influyen en la retención de empleados en redes de salud. Los hallazgos muestran una reducción del 24% en la rotación del personal de enfermería.',
      },
      pt: {
        summary:
          'Este estudo investiga como os programas de Action Learning influenciam a retenção de funcionários em redes de saúde. Os resultados demonstram uma redução de 24% na rotatividade da equipe de enfermagem.',
      },
      fr: {
        summary:
          "Cette étude examine comment les programmes d'Apprentissage par l'Action influencent la rétention des employés dans les réseaux de santé. Les résultats montrent une réduction de 24% du roulement du personnel.",
      },
    },
  },
  {
    title: 'Action Learning as a Catalyst for Government Sector Innovation',
    authors: ['Prof. David Chen'],
    published_year: 2024,
    summary:
      'Bureaucratic inertia often stifles innovation in the public sector. This article explores how three municipal governments implemented Action Learning to tackle long-standing civic issues like waste management and public transport routing. By asking breakthrough questions rather than jumping to standard protocols, the teams reduced operational costs by 15% within six months and developed new, responsive public policies.',
    key_findings: [
      { finding: '15% reduction in project operational costs', tags: ['government', 'finance'] },
      {
        finding: 'Shifted culture from protocol-driven to inquiry-driven',
        tags: ['leadership', 'innovation'],
      },
    ],
    relevance_tags: ['government', 'innovation', 'finance', 'leadership'],
    translations: {
      es: {
        summary:
          'La inercia burocrática a menudo sofoca la innovación en el sector público. Este artículo explora cómo tres gobiernos municipales implementaron el Aprendizaje en Acción para abordar problemas cívicos de larga data.',
      },
      pt: {
        summary:
          'A inércia burocrática muitas vezes sufoca a inovação no setor público. Este artigo explora como três governos municipais implementaram o Action Learning para lidar com problemas cívicos.',
      },
      fr: {
        summary:
          "L'inertie bureaucratique étouffe souvent l'innovation dans le secteur public. Cet article explore comment trois gouvernements municipaux ont mis en œuvre l'Apprentissage par l'Action.",
      },
    },
  },
  {
    title: 'Developing Global Leaders Through Multicultural Action Learning Teams',
    authors: ['Shannon Banks', 'Arthur Shelly'],
    published_year: 2022,
    summary:
      'As organizations become increasingly global, the need for leaders who can navigate cultural nuances is critical. This comprehensive review analyzes 40 multicultural Action Learning teams over two years. The research indicates that the strict rules of Action Learning—specifically the mandate that statements can only be made in response to questions—creates an egalitarian environment that completely bypasses aggressive cultural dominance and empowers introverted or non-native speakers.',
    key_findings: [
      {
        finding: 'Egalitarian structure bypasses cultural dominance',
        tags: ['diversity', 'leadership'],
      },
      {
        finding: 'Empowered introverts and non-native speakers',
        tags: ['coaching', 'team-performance'],
      },
    ],
    relevance_tags: ['leadership', 'diversity', 'team-performance', 'coaching'],
    translations: {
      es: {
        summary:
          'A medida que las organizaciones se vuelven cada vez más globales, la necesidad de líderes que puedan navegar por los matices culturales es crítica.',
      },
      pt: {
        summary:
          'À medida que as organizações se tornam cada vez mais globais, a necessidade de líderes que possam navegar pelas nuances culturais é crítica.',
      },
      fr: {
        summary:
          'Alors que les organisations deviennent de plus en plus mondiales, le besoin de leaders capables de naviguer dans les nuances culturelles est critique.',
      },
    },
  },
  {
    title: 'Scaling Agile in Tech Firms with Action Learning Coaching',
    authors: ['Elena Rodriguez'],
    published_year: 2025,
    summary:
      'Agile transformations often fail when teams adopt the ceremonies but not the mindset. This article details a case study of a mid-sized software company that integrated WIAL Action Learning coaches into their Agile sprint retrospectives. The integration led to a 40% improvement in sprint velocity and significantly higher psychological safety scores across engineering pods.',
    key_findings: [
      { finding: '40% improvement in sprint velocity', tags: ['technology', 'team-performance'] },
      {
        finding: 'Increased psychological safety by eliminating blame',
        tags: ['coaching', 'technology'],
      },
    ],
    relevance_tags: ['technology', 'team-performance', 'coaching'],
    translations: {
      es: {
        summary:
          'Las transformaciones ágiles a menudo fracasan cuando los equipos adoptan las ceremonias pero no la mentalidad.',
      },
      pt: {
        summary:
          'As transformações ágeis geralmente falham quando as equipes adotam as cerimônias, mas não a mentalidade.',
      },
      fr: {
        summary:
          "Les transformations agiles échouent souvent lorsque les équipes adoptent les cérémonies mais pas l'état d'esprit.",
      },
    },
  },
  {
    title: 'Transforming Non-Profit Board Alignment through Inquiry',
    authors: ['Dr. Peter Smith'],
    published_year: 2021,
    summary:
      'Non-profit boards frequently struggle with alignment, leading to operational paralysis. We documented the intervention of an Action Learning coach with a deeply divided environmental NGO board. By strictly enforcing the "questions only" rule during three dedicated sessions, the board was able to move past personal grievances, uncover a shared strategic vision, and secure a $2M grant that was previously stalled by infighting.',
    key_findings: [
      {
        finding: 'Unblocked stalled funding rounds through alignment',
        tags: ['nonprofit', 'finance'],
      },
      {
        finding: 'Reduced inter-personal conflicts at executive level',
        tags: ['leadership', 'nonprofit'],
      },
    ],
    relevance_tags: ['nonprofit', 'leadership', 'finance'],
    translations: {
      es: {
        summary:
          'Las juntas sin fines de lucro a menudo luchan con la alineación. Documentamos la intervención de un coach de Aprendizaje en Acción.',
      },
      pt: {
        summary:
          'Conselhos sem fins lucrativos frequentemente lutam com o alinhamento. Documentamos a intervenção de um coach de Action Learning.',
      },
      fr: {
        summary:
          "Les conseils d'administration de fondations luttent souvent avec l'alignement. Nous avons documenté l'intervention d'un coach d'Apprentissage par l'Action.",
      },
    },
  },
]

const webinarData = [
  {
    title: 'Action Learning for Healthcare: Surviving the Burnout Crisis',
    description:
      "Join Dr. Sarah Jenkins as she explores the exact methodology used to reduce nursing turnover by 24% at Mercy Hospital. We'll cover the basics of Action Learning, how to introduce it to overwhelmed staff, and what specific breakthrough questions helped clinical teams rebuild their empathy and operational resilience.",
    presenter: 'Dr. Sarah Jenkins',
    chapter_id: null,
    scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    title: 'From Agile to Action: Coaching Software Teams',
    description:
      'Elena Rodriguez breaks down why Agile transformations get stuck and how WIAL certified coaches can integrate Action Learning directly into Sprint Retrospectives to boost psychological safety and deliver a 40% jump in sprint velocity.',
    presenter: 'Elena Rodriguez',
    chapter_id: null,
    scheduled_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
]

async function seedAiData() {
  console.log('🤖 Starting AI Knowledge Engine Seed...')

  // Build embed strings for articles
  const embedStrings = articles.map(
    (a) => `${a.title} ${a.summary} ${a.relevance_tags.join(' ')}`
  )

  console.log(`Embedding ${articles.length} articles via OpenAI text-embedding-3-small...`)
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: embedStrings,
  })

  const articlesToInsert = articles.map((a, i) => ({
    ...a,
    embedding: embeddings[i],
    is_published: true,
  }))

  const { error: artError } = await supabase.from('journal_articles').insert(articlesToInsert)
  if (artError) {
    console.error('Error inserting articles:', artError)
  } else {
    console.log(`✅ Successfully seeded ${articles.length} journal articles!`)
  }

  // Insert webinars
  console.log('Inserting webinars...')
  const { error: webError } = await supabase.from('webinars').insert(webinarData)
  if (webError) {
    console.error('Error inserting webinars:', webError)
  } else {
    console.log(`✅ Successfully seeded ${webinarData.length} upcoming webinars!`)
  }

  console.log('Done!')
}

seedAiData().catch(console.error)
