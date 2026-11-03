import { motion } from 'motion/react'
import {
  Briefcase,
  Code2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import profilePhoto from '../assets/guna-profile.jpg'

function GithubLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.4 7.86 10.94.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  )
}

function LinkedinLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

const CONTACT = {
  name: 'Guna Sekhar Madireddi',
  title: 'Full-Stack Engineer',
  phone: '+91 95425 60328',
  email: 'guna281sekhar@gmail.com',
  github: 'https://github.com/MADIREDDIGUNASEKHAR',
  linkedin: 'https://www.linkedin.com/in/gunasekhar-madireddi-1743401b4/',
}

const SUMMARY =
  'Full-stack engineer with 3+ years designing and shipping production-grade, cloud-native applications. ' +
  'Proficient in React / Next.js on the frontend and Node.js / Express with REST & GraphQL on the backend, ' +
  'building scalable microservices with Docker and Kubernetes and real-time data flows over Kafka, Redis and ' +
  'WebSockets across SQL (PostgreSQL, MySQL) and NoSQL (MongoDB) stores. Additional hands-on experience with ' +
  'AI-powered systems and LLM integrations, leveraging AI dev tools (Claude Code, Codex, GitHub Copilot) to ship ' +
  'features fast while collaborating with product, design and engineering in an Agile environment. Strong ' +
  'foundation in DSA, Low-Level and System Design, delivering clean, scalable APIs and responsive interfaces ' +
  'end-to-end.'

interface ExperienceEntry {
  company: string
  role: string
  period: string
  bullets: string[]
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    company: 'Hala Mobility',
    role: 'Software Developer',
    period: 'Jul 2026 – Present',
    bullets: [
      'Built and owned backend microservices for an EV-sharing platform using Node.js, Express, REST/GraphQL, PostgreSQL, MySQL, and MongoDB, with services deployed through Docker and Kubernetes and supported by Kafka, Redis, and WebSockets for real-time workflows.',
      'Architected an end-to-end Roadside Assistance ticket lifecycle for field engineers, including acknowledgment tracking, on-site repair decisioning, automatic hub re-routing, and queue management to streamline vehicle issue resolution.',
      'Integrated Onsurity Gig Worker Insurance APIs using HMAC-signed REST, automating rider insurance activation, extensions, and coverage checks; redesigned the activation trigger from payment to vehicle deployment and supported premium quoting across multiple booking flows.',
      'Implemented an end-to-end wallet refund and payout system using Cashfree transfer webhooks, including refund-status reconciliation, wallet-payment validation, premium transaction recording, and comprehensive third-party API audit logging.',
    ],
  },
  {
    company: 'Tata Consultancy Services',
    role: 'Software Developer',
    period: 'Apr 2024 – Jul 2026',
    bullets: [
      'Built production-grade full-stack MERN modules for equipment charge management and payment workflows, improving charge-processing speed by 30% through optimized API flows and React UI.',
      'Designed React components for adding, selecting, updating and validating customer charge items; reduced manual errors by 40% with robust form validation and clean UX.',
      'Developed Node.js / Express backend APIs to handle billing logic, process charge data and manage customer transactions securely across multiple provisioning workflows.',
      'Integrated an external Billing Platform to auto-generate invoices per billing cycle, ensuring accurate end-to-end invoice creation.',
      'Investigated and fixed production bugs, optimized API payloads and improved UI responsiveness, increasing system stability and reducing incident turnaround.',
    ],
  },
  {
    company: 'TradioHub — AI-Powered Trading Journal & Analytics',
    role: 'Fullstack Intern',
    period: 'Sep 2023 – Mar 2024',
    bullets: [
      'Architected and delivered a full-stack trading journal and analytics platform end-to-end (React, Next.js, Node.js, SQL, Firebase, AWS), improving user workflow efficiency by 35%.',
      'Built dynamic dashboards with Next.js SSR/SSG, cutting page load times by 25% and improving responsiveness across devices.',
      'Designed normalized SQL schemas for trades, PnL metrics, strategy tags and journaling data, supporting efficient analytics at scale.',
      'Integrated broker REST APIs to auto-import trade history, eliminating 90% of manual data entry, and implemented a secure subscription & payment system.',
    ],
  },
]

interface ProjectEntry {
  name: string
  stack: string
  bullets: string[]
  url?: string
}

const PROJECTS: ProjectEntry[] = [
  {
    name: 'AI Resume Tailoring Agent',
    stack: 'Python · Groq (Llama 3-70B) · DOCX · Gmail SMTP · Excel/JSON',
    bullets: [
      'Built a fully autonomous job-application pipeline that ingests postings, generates a uniquely tailored resume per role (2–3s inference) and fires the application email — cutting manual effort from 30+ minutes per application to zero.',
      'Designed a structured prompt-engineering layer extracting role keywords, reordering skills and rewriting bullets so every output is ATS-optimized and distinct.',
      'Architected with strict separation of concerns (5 independent services) plus retry logic and per-job fault isolation, so a single API failure never kills the batch.',
    ],
  },
  {
    name: 'LLM Chat Server',
    stack: 'Node.js · Express · OpenRouter API · REST',
    bullets: [
      'Built a production-style LLM middleware server abstracting model complexity behind one unified API — routing to 10+ models (GPT-4o, Claude 3, Mistral, LLaMA 3) with a 1-line config change and zero client-side refactoring.',
      'Engineered a stateless, low-latency REST layer (POST /chat) handling prompt forwarding, response parsing and multi-model error normalization — under 300ms relay excluding inference.',
      'Implemented a security-first architecture with API-key isolation, CORS whitelisting and server-side validation; stateless design scales horizontally to 1000+ concurrent requests.',
    ],
  },
  {
    name: 'Hotel Offer Orchestrator',
    stack: 'Node.js · TypeScript · Express · Temporal · Redis · Docker Compose',
    url: 'https://github.com/MADIREDDIGUNASEKHAR/hotel-offer-orchestrator',
    bullets: [
      'Built a hotel-offer aggregation service orchestrated with Temporal workflows — fetching from two suppliers in parallel via Promise.allSettled, deduplicating by name (case/whitespace-insensitive) and keeping the cheapest offer per hotel.',
      'Designed the caching layer on Redis sorted sets scored by price, with the replace-and-filter sequence (DEL/ZADD/EXPIRE/ZRANGEBYSCORE) run atomically in a single MULTI/EXEC transaction.',
      'Implemented resilient failure handling: per-supplier retries with exponential backoff, automatic skip-and-continue when a supplier is down or slow (surfacing partial results via an X-Unavailable-Suppliers header), and distinct 502/503/504 error codes for workflow, dependency and timeout failures.',
    ],
  },
]

const SKILLS: { group: string; items: string[] }[] = [
  { group: 'Languages', items: ['Java', 'Python', 'JavaScript (ES6+)', 'TypeScript', 'HTML', 'CSS'] },
  { group: 'Frontend', items: ['React.js', 'Next.js', 'Tailwind CSS', 'Responsive UI'] },
  { group: 'Backend', items: ['Node.js', 'Express.js', 'Microservices', 'REST & GraphQL APIs', 'Auth (JWT / Firebase)'] },
  { group: 'Real-time & Data', items: ['Kafka', 'Redis', 'RabbitMQ', 'WebSockets'] },
  { group: 'Databases', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQL schema design & optimization', 'Supabase'] },
  { group: 'DevOps & Cloud', items: ['Docker', 'Kubernetes', 'AWS', 'Firebase', 'GCP', 'Git', 'Postman'] },
  { group: 'AI Dev Tools', items: ['Claude Code', 'Codex', 'GitHub Copilot', 'Generative AI APIs'] },
  { group: 'Foundations', items: ['DSA (250+ problems)', 'OOP', 'LLD / Design Patterns', 'HLD', 'System Design'] },
]

const EDUCATION = [
  {
    school: 'Scaler Academy — Software and AI Engineering Program',
    detail: 'Specialisation in Software Development & Gen AI Fundamentals',
    period: '2023 – 2025',
  },
  {
    school: 'SRM University, Chennai',
    detail: 'B.Tech — Electronics & Communication Engineering',
    period: '2019 – 2023',
  },
]

function SectionHeading({ icon: Icon, children }: { icon: typeof Briefcase; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-primary" strokeWidth={2.25} />
      <h2 className="font-semibold text-foreground">{children}</h2>
    </div>
  )
}

function SkillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
      {children}
    </span>
  )
}

export default function About() {
  return (
    <div className="space-y-6">
      <PageHeader icon={UserRound} title="About Me" description="The developer behind this project" />

      <Card hoverable className="relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={profilePhoto}
            alt={CONTACT.name}
            className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-sm shadow-blue-600/30 ring-1 ring-white/60"
          />
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-foreground tracking-tight">{CONTACT.name}</h3>
            <p className="text-sm text-primary font-medium mt-0.5">{CONTACT.title}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border/60 bg-white/60 backdrop-blur-sm px-3 py-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                {CONTACT.email}
              </a>
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border/60 bg-white/60 backdrop-blur-sm px-3 py-1.5"
              >
                <Phone className="h-3.5 w-3.5" />
                {CONTACT.phone}
              </a>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground rounded-full border border-border/60 bg-white/60 backdrop-blur-sm px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5" />
                India
              </span>
              <a
                href={CONTACT.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border/60 bg-white/60 backdrop-blur-sm px-3 py-1.5"
              >
                <GithubLogo className="h-3.5 w-3.5" />
                GitHub
              </a>
              <a
                href={CONTACT.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-[#0A66C2] hover:text-[#004182] transition-colors rounded-full border border-border/60 bg-white/60 backdrop-blur-sm px-3 py-1.5"
              >
                <LinkedinLogo className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeading icon={Sparkles}>Summary</SectionHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">{SUMMARY}</p>
      </Card>

      <Card>
        <SectionHeading icon={Briefcase}>Experience</SectionHeading>
        <div className="space-y-5">
          {EXPERIENCE.map((entry, i) => (
            <motion.div
              key={entry.company}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="relative pl-5 border-l-2 border-primary/20"
            >
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h3 className="font-semibold text-sm text-foreground">{entry.company}</h3>
                <span className="text-xs text-muted-foreground/80">{entry.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{entry.role}</p>
              <ul className="space-y-1.5">
                {entry.bullets.map((b, bi) => (
                  <li key={bi} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-primary/60 shrink-0">—</span>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading icon={Code2}>Projects</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROJECTS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Card hoverable className="h-full !p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground">{p.name}</h3>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
                    >
                      <GithubLogo className="h-3 w-3" />
                      GitHub
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1 mb-2.5">{p.stack}</p>
                <ul className="space-y-1.5">
                  {p.bullets.map((b, bi) => (
                    <li key={bi} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                      <span className="text-primary/60 shrink-0">—</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading icon={Sparkles}>Skills</SectionHeading>
        <div className="space-y-3.5">
          {SKILLS.map((s) => (
            <div key={s.group} className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sm:w-36 shrink-0 sm:pt-1">
                {s.group}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {s.items.map((item) => (
                  <SkillTag key={item}>{item}</SkillTag>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading icon={GraduationCap}>Education</SectionHeading>
        <div className="space-y-3">
          {EDUCATION.map((e) => (
            <div key={e.school} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <div>
                <h3 className="font-semibold text-sm text-foreground">{e.school}</h3>
                <p className="text-xs text-muted-foreground">{e.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground/80">{e.period}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
